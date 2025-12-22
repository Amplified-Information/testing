package services

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"

	"os"

	"api/server/lib"
	repositories "api/server/repositories"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type HederaService struct {
	hedera_client *hiero.Client
	dbRepository  *repositories.DbRepository
}

func (h *HederaService) InitHedera() (*hiero.Client, error) {
	networkSelected := os.Getenv("HEDERA_NETWORK_SELECTED")
	operatorIdStr := os.Getenv("HEDERA_OPERATOR_ID")
	operatorKeyType := os.Getenv("HEDERA_OPERATOR_KEY_TYPE")
	operatorKeyStr := os.Getenv("HEDERA_OPERATOR_KEY")

	operatorId, err := hiero.AccountIDFromString(operatorIdStr)
	if err != nil {
		return nil, fmt.Errorf("invalid HEDERA_OPERATOR_ID: %v", err)
	}

	operatorKey := hiero.PrivateKey{}
	switch operatorKeyType {
	case "ECDSA":
		operatorKey, err = hiero.PrivateKeyFromStringECDSA(operatorKeyStr)
		if err != nil {
			return nil, fmt.Errorf("invalid HEDERA_OPERATOR_KEY: %v", err)
		}
	case "ED25519":
		operatorKey, err = hiero.PrivateKeyFromStringEd25519(operatorKeyStr)
		if err != nil {
			return nil, fmt.Errorf("invalid HEDERA_OPERATOR_KEY: %v", err)
		}
	default:
		return nil, fmt.Errorf("unsupported HEDERA_OPERATOR_KEY_TYPE: %s", operatorKeyType)
	}

	client, err := hiero.ClientForName(networkSelected)
	if err != nil {
		return nil, fmt.Errorf("failed to create Hedera client: %v", err)
	}

	client.SetOperator(operatorId, operatorKey)

	h.hedera_client = client
	log.Println("Hedera service initialized successfully")
	return client, nil
}

func (h *HederaService) VerifySig(publicKey *hiero.PublicKey, payloadHex string, sigBase64 string) (bool, error) {
	sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}
	sigHex := fmt.Sprintf("%x", sigBytes)
	sig := make([]byte, len(sigHex)/2)
	_, err = hex.Decode(sig, []byte(sigHex))
	if err != nil {
		return false, fmt.Errorf("Error decoding signature hex: %v", err)
	}

	payload, err := lib.Hex2utf8(payloadHex)
	keccak := lib.Keccak256([]byte(payload))
	log.Printf("keccak (hex) calc'd on back-end: %x", keccak)

	// JavaScript equivalent (see: test.ts:55):

	keccak64 := base64.StdEncoding.EncodeToString(keccak) // N.B. this line is required for base64 hashpack encoding
	keccak64PrefixedStr := lib.PrefixMessageToSign(keccak64)

	// Now verify the signature
	isValid := publicKey.VerifySignedMessage([]byte(keccak64PrefixedStr), sig)
	if isValid {
		return true, nil
	}
	return false, fmt.Errorf("Invalid signature")
}

func (h *HederaService) GetPublicKey(accountId hiero.AccountID) (*hiero.PublicKey, lib.HederaKeyType, error) {
	keyType := lib.HederaKeyType(0)

	// TODO... may get rate limited here...
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s", os.Getenv("HEDERA_NETWORK_SELECTED"), accountId)
	resp, err := lib.Fetch(lib.GET, mirrorNodeURL, nil)

	if err != nil {
		return nil, keyType, fmt.Errorf("failed to query mirror node: %v", err)
	}

	if resp.StatusCode != 200 {
		return nil, keyType, fmt.Errorf("mirror node returned status code %d", resp.StatusCode)
	}

	defer resp.Body.Close()

	var jsonParseResult struct {
		Key struct {
			Key   string `json:"key"`
			Type_ string `json:"_type"`
		} `json:"key"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&jsonParseResult); err != nil {
		return nil, keyType, fmt.Errorf("failed to parse mirror node response: %v", err)
	}

	publicKey := &hiero.PublicKey{}
	if strings.HasPrefix(strings.ToUpper(jsonParseResult.Key.Type_), "ECDSA") {
		key, err := hiero.PublicKeyFromStringECDSA(jsonParseResult.Key.Key)
		if err != nil {
			return nil, keyType, fmt.Errorf("failed to parse public key (ECDSA) from string: %v", err)
		}
		publicKey = &key
	} else if strings.HasPrefix(strings.ToUpper(jsonParseResult.Key.Type_), "ED25519") {
		key, err := hiero.PublicKeyFromStringEd25519(jsonParseResult.Key.Key)
		if err != nil {
			return nil, keyType, fmt.Errorf("failed to parse public key (ED25519) from string: %v", err)
		}
		publicKey = &key
	} else {
		return nil, keyType, fmt.Errorf("unsupported key type: %s", jsonParseResult.Key.Type_)
	}

	switch strings.ToUpper(jsonParseResult.Key.Type_) {
	case "ECDSA_SECP256K1":
		keyType = lib.KEY_TYPE_ECDSA
	case "ED25519":
		keyType = lib.KEY_TYPE_ED25519
	}

	return publicKey, keyType, nil
}

func (h *HederaService) GetSpenderAllowanceUsd(networkSelected hiero.LedgerID, accountId hiero.AccountID, smartContractId hiero.ContractID, usdcAddress hiero.ContractID, usdcDecimals uint64) (float64, error) {
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s/allowances/tokens?spender.id=eq:%s&token.id=eq:%s", networkSelected.String(), accountId.String(), smartContractId.String(), usdcAddress.String())

	resp, err := lib.Fetch(lib.GET, mirrorNodeURL, nil)
	if err != nil {
		return 0, fmt.Errorf("error fetching allowance: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return 0, fmt.Errorf("network response was not ok: status %d", resp.StatusCode)
	}

	var result struct {
		Allowances []struct {
			Amount int64 `json:"amount"`
		} `json:"allowances"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Allowances) == 0 {
		return 0, nil
	}

	// Convert to float64 and apply decimals
	amount := float64(result.Allowances[0].Amount) / math.Pow(10, float64(usdcDecimals))
	return amount, nil
}

/*
*
This function takes a number of input parameters from the YES and NO side
- performs validation
- determines which side (YES or NO) gets the YES or NO position tokens (the negative USD side gets the NO, the positive side gets the YES)
- in the event of a partial match, the lower collatoralUsd amount (priceUsd * qty) is used for the collateral
- constructs sigObjYes/sigObjNo off-chain. sigObjYes and sigObjNo have key type information embedded in them
- submits to the buyPositionTokensOnBehalfAtomic(...) function on the Prism smart contract

* @param marketId - nique market ID for the transaction (UUIDv7 string)
* @param origQtyYes - quantity of YES position tokens requested by the user when they originally placed the order
* @param origQtyNo - quantity of NO position tokens requested by the user when they originally placed the order
* @param origPriceUsdYes - price (USD) of the market when the user originally placed the order (negative number => YES, positive number => NO)
* @param origPriceUsdNo - price (USD) of the market when the user originally placed the order (negative number => YES, positive number => NO)
* @param txIdUuidYes -
* @param txIdUuidNo -
* @param sigYes64 -
* @param sigNo64 -
* @param publicKeyYesHex -
* @param publicKeyNoHex -
* @param evmYes -
* @param evmNo -
* @param keyTypeYes -
* @param keyTypeNo -

* @return bool - Returns true if the transaction is successful, otherwise false.
* @return error - Returns an error if the transaction fails or the receipt cannot be retrieved.
*/
func (h *HederaService) BuyPositionTokens(
	marketId string,
	origQtyYes float64,
	origQtyNo float64,
	origPriceUsdYes float64,
	origPriceUsdNo float64,
	accountIdYes string,
	accountIdNo string,
	txIdUuidYes string,
	txIdUuidNo string,
	sigYes64 string,
	sigNo64 string,
	publicKeyYesHex string,
	publicKeyNoHex string,
	evmYes string,
	evmNo string,
	keyTypeYes int32,
	keyTypeNo int32,
) (bool, error) {

	// TODO - do this swapping on-chain
	// // do we need to flip which accoundId is YES and which accountId is NO?
	// if origPriceUsdNo < 0 && origPriceUsdYes > 0 { // Yes side get YES position tokens, No side gets NO position tokens
	// 	// canonical situation - the ordering is correct as-is
	// } else if origPriceUsdYes < 0 && origPriceUsdNo > 0 { // Yes side gets NO position tokens, No side gets YES position tokens
	// 	origQtyYes, origQtyNo = origQtyNo, origQtyYes
	// 	origPriceUsdYes, origPriceUsdNo = origPriceUsdNo, origPriceUsdYes
	// 	accountIdYes, accountIdNo = accountIdNo, accountIdYes
	// 	txIdUuidYes, txIdUuidNo = txIdUuidNo, txIdUuidYes
	// 	sigYes64, sigNo64 = sigNo64, sigYes64
	// 	publicKeyYesHex, publicKeyNoHex = publicKeyNoHex, publicKeyYesHex
	// 	evmYes, evmNo = evmNo, evmYes
	// 	keyTypeYes, keyTypeNo = keyTypeNo, keyTypeYes
	// } else {
	// 	// all other situations (including == 0.0) can never happen:
	// 	return false, fmt.Errorf("invalid price_usd values for YES and NO positions: %f, %f", origPriceUsdYes, origPriceUsdNo)
	// }

	usdcDecimalsStr := os.Getenv("USDC_DECIMALS")
	usdcDecimals, err := strconv.ParseUint(usdcDecimalsStr, 10, 64)
	if err != nil {
		return false, fmt.Errorf("invalid USDC_DECIMALS: %w", err)
	}
	// For signature verification, we need seperate reconstruction of the payloads for YES and NO positions, including collateralUsd
	// const collateralUsd_abs_scaled = floatToBigIntScaledDecimals(Math.abs(predictionIntentRequest.priceUsd * predictionIntentRequest.qty), usdcDecimals).toString()
	collateralUsdAbsScaledYes, err := lib.FloatToBigIntScaledDecimals(math.Abs(origPriceUsdYes*origQtyYes), int(usdcDecimals))
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsYes: %v", err)
	}

	collateralUsdAbsScaledNo, err := lib.FloatToBigIntScaledDecimals(math.Abs(origPriceUsdNo*origQtyNo), int(usdcDecimals))
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsNo: %v", err)
	}

	// collateralUsdAbsYes := math.Abs(origPriceUsdYes * origQtyYes)
	// collateralUsdAbsScaledYes, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsYes)
	// if err != nil {
	// 	return false, fmt.Errorf("failed to scale collateralUsdAbsYes: %v", err)
	// }

	// For signature verification, we need seperate reconstruction of the payloads for YES and NO positions, including collateralUsd
	// collateralUsdAbsNo := math.Abs(origPriceUsdNo * origQtyNo)
	// collateralUsdAbsScaledNo, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsNo)
	// if err != nil {
	// 	return false, fmt.Errorf("failed to scale collateralUsdAbsNo: %v", err)
	// }

	sigYes, err := base64.StdEncoding.DecodeString(sigYes64)
	if err != nil {
		log.Printf("Error decoding sigYes64 from base64: %v", err)
		return false, err
	}
	sigNo, err := base64.StdEncoding.DecodeString(sigNo64)
	if err != nil {
		log.Printf("Error decoding sigNo64 from base64: %v", err)
		return false, err
	}

	log.Printf("sigYes (len=%d): %x", len(sigYes), sigYes)
	log.Printf("sigNo (len=%d): %x", len(sigNo), sigNo)

	serializedPayloadYes, err := lib.AssemblePayloadHexForSigning(collateralUsdAbsScaledYes, marketId, txIdUuidYes)
	if err != nil {
		return false, fmt.Errorf("failed to extract YES payload for signing: %v", err)
	}
	serializedPayloadNo, err := lib.AssemblePayloadHexForSigning(collateralUsdAbsScaledNo, marketId, txIdUuidNo)
	if err != nil {
		return false, fmt.Errorf("failed to extract NO payload for signing: %v", err)
	}
	log.Printf("serializedPayloadYes: %s", serializedPayloadYes)
	log.Printf("serializedPayloadNo: %s", serializedPayloadNo)

	// calculate the keccak256 hash of the serialized payload
	payloadYes, _ := lib.Hex2utf8(serializedPayloadYes)
	payloadNo, _ := lib.Hex2utf8(serializedPayloadNo)
	keccakYes := lib.Keccak256([]byte(payloadYes))
	keccakNo := lib.Keccak256([]byte(payloadNo))
	log.Printf("keccakYes calc'd server-side (hex): %x", keccakYes)
	log.Printf("keccakNo calc'd server-side (hex): %x", keccakNo)

	// create a hiero public key for the hex string and key type (ecdasa/ed25519)
	publicKeyYes, err := lib.PublicKeyForKeyType(publicKeyYesHex, lib.HederaKeyType(keyTypeYes))
	if err != nil {
		return false, fmt.Errorf("failed to get publicKeyYes: %v", err)
	}
	publicKeyNo, err := lib.PublicKeyForKeyType(publicKeyNoHex, lib.HederaKeyType(keyTypeNo))
	if err != nil {
		return false, fmt.Errorf("failed to get publicKeyNo: %v", err)
	}

	/////
	// OK
	// now call the smart contract...
	/////
	marketIdBig, err := lib.Uuid7_to_bigint(marketId)
	if err != nil {
		return false, fmt.Errorf("failed to convert marketId to bigint: %w", err)
	}

	txIdYesBig, err := lib.Uuid7_to_bigint(txIdUuidYes)
	if err != nil {
		return false, fmt.Errorf("failed to convert txIdUuidYes to bigint: %w", err)
	}
	txIdNoBig, err := lib.Uuid7_to_bigint(txIdUuidNo)
	if err != nil {
		return false, fmt.Errorf("failed to convert txIdUuidNo to bigint: %w", err)
	}

	// partial fills MUST take the *lower* Usd collateral value - this comparison is done on-chain
	// collateralUsdAbsScaledMin := collateralUsdAbsScaledYes
	// if collateralUsdAbsScaledNo.Cmp(collateralUsdAbsScaledYes) < 0 {
	// 	collateralUsdAbsScaledMin = collateralUsdAbsScaledNo
	// }

	// sigObjYes and sigObjNo (Hedera format signature objects)
	sigObjYes, err := lib.BuildSignatureMap(publicKeyYes, sigYes, lib.HederaKeyType(keyTypeYes))
	sigObjNo, err := lib.BuildSignatureMap(publicKeyNo, sigNo, lib.HederaKeyType(keyTypeNo))
	log.Printf("sigYes (keyType=%d) (hex): %x", keyTypeYes, sigYes)
	log.Printf("sigNo (keyType=%d) (hex): %x", keyTypeNo, sigNo)

	/////
	// submit to the smart contract :)
	/////
	/*
		TypeScript code that works - buy 4_buy.ts:

		const buyTx4 = await new ContractExecuteTransaction()
			.setContractId(contractId)
			.setGas(2_000_000) // approx 1 million per USDC transfer (two USDC transfers in the atomic function)
			.setFunction(
				'buyPositionTokensOnBehalfAtomic',
				params
			)
			.execute(client)

		const buyReceipt4 = await buyTx4.getReceipt(client)
		console.log(`buyPositionTokensOnBehalf(marketId=${marketId},...) status:`, buyReceipt4.status.toString())

	*/
	params := hiero.NewContractFunctionParameters()
	// uint128 marketId,
	// address signerYes,
	// address signerNo,
	// uint256 collateralUsdAbsScaledYes,
	// uint256 collateralUsdAbsScaledNo,
	// uint128 txIdYes,
	// uint128 txIdNo,
	// bytes calldata sigObjYes,
	// bytes calldata sigObjNo
	params.AddUint128BigInt(marketIdBig)               // marketId
	params.AddAddress(accountIdYes)                    // signerYes
	params.AddAddress(accountIdNo)                     // signerNo
	params.AddUint256BigInt(collateralUsdAbsScaledYes) // collateralUsdAbsScaledYes
	params.AddUint256BigInt(collateralUsdAbsScaledNo)  // collateralUsdAbsScaledNo
	params.AddUint128BigInt(txIdYesBig)                // txIdYes
	params.AddUint128BigInt(txIdNoBig)                 // txIdNo
	params.AddBytes(sigObjYes)                         // sigObjYes
	params.AddBytes(sigObjNo)                          // sigObjNo

	log.Printf("Prepared smart contract parameters for BuyPositionTokens")
	log.Println("marketIdBytes (hex):", hex.EncodeToString(marketIdBig.Bytes()))
	log.Println("accountIdYes:", accountIdYes)
	log.Println("accountIdNo:", accountIdNo)
	log.Println("collateralUsdAbsScaledYes:", collateralUsdAbsScaledYes.String())
	log.Println("collateralUsdAbsScaledNo:", collateralUsdAbsScaledNo.String())
	log.Println("txIdYesBig (hex):", hex.EncodeToString(txIdYesBig.Bytes()))
	log.Println("txIdNoBig (hex):", hex.EncodeToString(txIdNoBig.Bytes()))
	log.Printf("sigObjYes (len=%d): %x", len(sigObjYes), sigObjYes)
	log.Printf("sigObjNo (len=%d): %x", len(sigObjNo), sigObjNo)

	contractID, err := hiero.ContractIDFromString(
		os.Getenv("SMART_CONTRACT_ID"),
	)
	if err != nil {
		return false, fmt.Errorf("invalid contract ID: %v", err)
	}

	tx, err := hiero.NewContractExecuteTransaction().
		SetContractID(contractID).
		SetGas(5_000_000). // TODO - can this be lowered? 2M in 4_buy.ts
		SetFunction("buyPositionTokensOnBehalfAtomic", params).
		Execute(h.hedera_client)
	if err != nil {
		return false, fmt.Errorf("failed to execute contract: %v", err)
	}

	receipt, err := tx.GetReceipt(h.hedera_client)
	if err != nil {
		return false, fmt.Errorf("failed to get transaction receipt: %v", err)
	}

	log.Printf("buyPositionTokensOnBehalfAtomic(marketId=%s, ...) status: %s", marketId, receipt.Status.String())

	/////
	// db
	// - Record the tx on the database (auditing)
	// - record the price on the price table
	/////

	// record the successful on-chain settlement
	txHash := receipt.TransactionID.String()
	log.Printf("TransactionID (txHash) for successful settlement: %s", txHash)
	err = h.dbRepository.CreateSettlement(txIdUuidYes, txIdUuidNo, txHash)
	if err != nil {
		return false, fmt.Errorf("Error logging a successful tx to settlements table: %v", err)
	}

	// record the price
	err = h.dbRepository.SavePriceHistory(marketId, origPriceUsdYes) // TODO - check this
	if err != nil {
		return false, fmt.Errorf("Error saving price history for market %s: %v", marketId, err)
	}
	err = h.dbRepository.SavePriceHistory(marketId, origPriceUsdNo)
	if err != nil {
		return false, fmt.Errorf("Error saving price history for market %s: %v", marketId, err)
	}

	// if we get here, return true
	return true, nil
}
