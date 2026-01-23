package services

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/big"
	"strconv"
	"strings"

	"os"

	pb_api "api/gen"
	pb_clob "api/gen/clob"
	"api/server/lib"
	repositories "api/server/repositories"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type HederaService struct {
	hedera_clients  map[string]*hiero.Client // look up based on 'previewnet', 'testnet', 'mainnet'
	dbRepository    *repositories.DbRepository
	priceRepository *repositories.PriceRepository
}

func (hs *HederaService) InitHedera(dbRepository *repositories.DbRepository, priceRepository *repositories.PriceRepository) error {
	hs.dbRepository = dbRepository
	hs.priceRepository = priceRepository

	// First initialize the map to avoid nil map assignment
	hs.hedera_clients = make(map[string]*hiero.Client)

	var err error

	hs.hedera_clients["previewnet"], err = hs.initHederaNet("previewnet")
	if err != nil {
		return err
	}

	hs.hedera_clients["mainnet"], err = hs.initHederaNet("mainnet")
	if err != nil {
		return err
	}

	hs.hedera_clients["testnet"], err = hs.initHederaNet("testnet")
	if err != nil {
		return err
	}

	return nil
}

func (hs *HederaService) initHederaNet(networkSelected string) (*hiero.Client, error) {
	operatorIdStr := os.Getenv(fmt.Sprintf("%s_HEDERA_OPERATOR_ID", strings.ToUpper(networkSelected)))
	operatorKeyType := strings.ToUpper(os.Getenv(fmt.Sprintf("%s_HEDERA_OPERATOR_KEY_TYPE", strings.ToUpper(networkSelected))))

	// validate the accountId
	operatorId, err := hiero.AccountIDFromString(operatorIdStr)
	if err != nil {
		return nil, fmt.Errorf("invalid %s_HEDERA_OPERATOR_ID: %v", strings.ToUpper(networkSelected), err)
	}

	operatorKey := hiero.PrivateKey{}
	switch operatorKeyType {
	case "ECDSA":
		operatorKey, err = hiero.PrivateKeyFromStringECDSA(os.Getenv(fmt.Sprintf("%s_HEDERA_OPERATOR_KEY", strings.ToUpper(networkSelected))))
		if err != nil {
			return nil, fmt.Errorf("invalid %s_HEDERA_OPERATOR_KEY: %v", strings.ToUpper(networkSelected), err)
		}
	case "ED25519":
		operatorKey, err = hiero.PrivateKeyFromStringEd25519(os.Getenv(fmt.Sprintf("%s_HEDERA_OPERATOR_KEY", strings.ToUpper(networkSelected))))
		if err != nil {
			return nil, fmt.Errorf("invalid %s_HEDERA_OPERATOR_KEY: %v", strings.ToUpper(networkSelected), err)
		}
	default:
		return nil, fmt.Errorf("unsupported %s_HEDERA_OPERATOR_KEY_TYPE: %s", strings.ToUpper(networkSelected), operatorKeyType)
	}

	client, err := hiero.ClientForName(networkSelected)
	if err != nil {
		return nil, fmt.Errorf("failed to create Hedera client: %v", err)
	}

	client.SetOperator(operatorId, operatorKey)

	log.Printf("Service: Hedera service (%s) initialized successfully", strings.ToUpper(networkSelected))
	return client, nil
}

func (hs *HederaService) GetPublicKey(accountId hiero.AccountID, net string) (*hiero.PublicKey, lib.HederaKeyType, error) {
	keyType := lib.HederaKeyType(0)

	// TODO... may get rate limited here...
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s", net, accountId)
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
	// log.Printf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s/allowances/tokens?spender.id=eq:%s&token.id=eq:%s", networkSelected.String(), accountId.String(), smartContractId.String(), usdcAddress.String())

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
func (h *HederaService) BuyPositionTokens(sideYes *pb_clob.CreateOrderRequestClob, sideNo *pb_clob.CreateOrderRequestClob) (bool, error) {
	// validate that sideYes.MarketId == sideNo.MarketId and sideYes.MarketId != ""
	if sideYes.MarketId != sideNo.MarketId || sideYes.MarketId == "" {
		return false, fmt.Errorf("market IDs do not match or invalid: %s vs %s", sideYes.MarketId, sideNo.MarketId)
	}

	// validate that a price is not zero
	if sideYes.PriceUsd == 0.0 || sideNo.PriceUsd == 0.0 {
		return false, fmt.Errorf("priceUsd cannot be zero: %f vs %f", sideYes.PriceUsd, sideNo.PriceUsd)
	}

	// validate that one price is negative and one price is positive
	if (sideYes.PriceUsd > 0 && sideNo.PriceUsd > 0) || (sideYes.PriceUsd < 0 && sideNo.PriceUsd < 0) {
		return false, fmt.Errorf("both prices have the same sign: %f vs %f", sideYes.PriceUsd, sideNo.PriceUsd)
	}

	// validate that both orders are on the same network
	if (sideYes.Net != sideNo.Net) || (sideYes.Net == "") {
		return false, fmt.Errorf("networks do not match or are invalid: %s vs %s", sideYes.Net, sideNo.Net)
	}

	// OK - proceed

	// sideYes should have the positive priceUsd, sideNo should have the negative priceUsd
	if sideYes.PriceUsd <= 0 {
		// flip yes and no sides
		sideYes, sideNo = sideNo, sideYes
	}

	usdcDecimalsStr := os.Getenv("USDC_DECIMALS")
	usdcDecimals, err := strconv.ParseUint(usdcDecimalsStr, 10, 64)
	if err != nil {
		return false, fmt.Errorf("invalid USDC_DECIMALS: %w", err)
	}
	// For signature verification, we need seperate reconstruction of the payloads for YES and NO positions, including collateralUsd
	// const collateralUsd_abs_scaled = floatToBigIntScaledDecimals(Math.abs(predictionIntentRequest.priceUsd * predictionIntentRequest.qty), usdcDecimals).toString()
	collateralUsdAbsScaledYes, err := lib.FloatToBigIntScaledDecimals(math.Abs(sideYes.PriceUsd*sideYes.QtyOrig /* N.B. use QtyOrig and not Qty (remaining amount) */), int(usdcDecimals))
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsYes: %v", err)
	}

	collateralUsdAbsScaledNo, err := lib.FloatToBigIntScaledDecimals(math.Abs(sideNo.PriceUsd*sideNo.QtyOrig /* N.B. use QtyOrig and not Qty (remaining amount) */), int(usdcDecimals))
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsNo: %v", err)
	}

	sigYes, err := base64.StdEncoding.DecodeString(sideYes.Sig) // Sig is base64-encoded
	if err != nil {
		log.Printf("Error decoding sigYes64 from base64: %v", err)
		return false, err
	}
	sigNo, err := base64.StdEncoding.DecodeString(sideNo.Sig) // Sig is base64-encoded
	if err != nil {
		log.Printf("Error decoding sigNo64 from base64: %v", err)
		return false, err
	}

	log.Printf("sigYes (len=%d): %x", len(sigYes), sigYes)
	log.Printf("sigNo (len=%d): %x", len(sigNo), sigNo)

	serializedPayloadYes, err := lib.AssemblePayloadHexForSigning(&pb_api.PredictionIntentRequest{
		PriceUsd:   sideYes.PriceUsd,
		Qty:        sideYes.QtyOrig, // N.B. use QtyOrig and not Qty (remaining amount) - digital sig verifies based on original quantity, not current available Qty
		MarketId:   sideYes.MarketId,
		EvmAddress: sideYes.EvmAddress,
		TxId:       sideYes.TxId,
	}, usdcDecimals)
	if err != nil {
		return false, fmt.Errorf("failed to extract YES payload for signing: %v", err)
	}

	serializedPayloadNo, err := lib.AssemblePayloadHexForSigning(&pb_api.PredictionIntentRequest{
		PriceUsd:   sideNo.PriceUsd,
		Qty:        sideNo.QtyOrig, // N.B. use QtyOrig and not Qty (remaining amount) - digital sig verifies based on original quantity, not current available Qty
		MarketId:   sideNo.MarketId,
		EvmAddress: sideNo.EvmAddress,
		TxId:       sideNo.TxId,
	}, usdcDecimals)
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
	publicKeyYes, err := lib.PublicKeyForKeyType(sideYes.PublicKey, lib.HederaKeyType(sideYes.KeyType))
	if err != nil {
		return false, fmt.Errorf("failed to get publicKeyYes: %v", err)
	}
	publicKeyNo, err := lib.PublicKeyForKeyType(sideNo.PublicKey, lib.HederaKeyType(sideNo.KeyType))
	if err != nil {
		return false, fmt.Errorf("failed to get publicKeyNo: %v", err)
	}

	/////
	// OK
	// now call the smart contract...
	/////
	marketIdBig, err := lib.Uuid7_to_bigint(sideYes.MarketId) // same for yes and no sides
	if err != nil {
		return false, fmt.Errorf("failed to convert marketId to bigint: %w", err)
	}

	txIdYesBig, err := lib.Uuid7_to_bigint(sideYes.TxId)
	if err != nil {
		return false, fmt.Errorf("failed to convert txIdUuidYes to bigint: %w", err)
	}
	txIdNoBig, err := lib.Uuid7_to_bigint(sideNo.TxId)
	if err != nil {
		return false, fmt.Errorf("failed to convert txIdUuidNo to bigint: %w", err)
	}

	// sigObjYes and sigObjNo (Hedera format signature objects)
	sigObjYes, err := lib.BuildSignatureMap(publicKeyYes, sigYes, lib.HederaKeyType(sideYes.KeyType))
	sigObjNo, err := lib.BuildSignatureMap(publicKeyNo, sigNo, lib.HederaKeyType(sideNo.KeyType))
	log.Printf("sigYes (keyType=%d) (hex): %x", sideYes.KeyType, sigYes)
	log.Printf("sigNo (keyType=%d) (hex): %x", sideNo.KeyType, sigNo)

	/////
	// submit to the smart contract :)
	/////
	params := hiero.NewContractFunctionParameters()
	params.AddUint128BigInt(marketIdBig)               // marketId
	params.AddAddress(sideYes.EvmAddress)              // signerYes
	params.AddAddress(sideNo.EvmAddress)               // signerNo
	params.AddUint256BigInt(collateralUsdAbsScaledYes) // collateralUsdAbsScaledYes
	params.AddUint256BigInt(collateralUsdAbsScaledNo)  // collateralUsdAbsScaledNo
	params.AddUint128BigInt(txIdYesBig)                // txIdYes
	params.AddUint128BigInt(txIdNoBig)                 // txIdNo
	params.AddBytes(sigObjYes)                         // sigObjYes
	params.AddBytes(sigObjNo)                          // sigObjNo

	log.Printf("Prepared smart contract parameters for BuyPositionTokens")
	log.Println("marketIdBytes (hex):", hex.EncodeToString(marketIdBig.Bytes()))
	log.Println("accountIdYes:", sideYes.EvmAddress)
	log.Println("accountIdNo:", sideNo.EvmAddress)
	log.Println("collateralUsdAbsScaledYes:", collateralUsdAbsScaledYes.String())
	log.Println("collateralUsdAbsScaledNo:", collateralUsdAbsScaledNo.String())
	log.Println("txIdYesBig (hex):", hex.EncodeToString(txIdYesBig.Bytes()))
	log.Println("txIdNoBig (hex):", hex.EncodeToString(txIdNoBig.Bytes()))
	log.Printf("sigObjYes (len=%d): %x", len(sigObjYes), sigObjYes)
	log.Printf("sigObjNo (len=%d): %x", len(sigObjNo), sigObjNo)

	contractID, err := hiero.ContractIDFromString(
		os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(sideYes.Net))),
	)
	if err != nil {
		return false, fmt.Errorf("invalid contract ID: %v", err)
	}

	tx, err := hiero.NewContractExecuteTransaction().
		SetContractID(contractID).
		SetGas(5_000_000). // TODO - can this be lowered? 2M in 4_buy.ts
		SetFunction("buyPositionTokensOnBehalfAtomic", params).
		Execute(h.hedera_clients[sideYes.Net]) // both sides are guaranteed to be on the same network
	if err != nil {
		return false, fmt.Errorf("failed to execute contract: %v", err)
	}

	receipt, err := tx.GetReceipt(h.hedera_clients[sideYes.Net]) // both sides are guaranteed to be on the same network
	if err != nil {
		return false, fmt.Errorf("failed to get transaction receipt: %v", err)
	}

	// the smart contract function returns (nYes, nNo)
	record, err := tx.GetRecord(h.hedera_clients[sideYes.Net])
	if err != nil {
		return false, fmt.Errorf("failed to get transaction record: %v", err)
	}
	nYesTokens := new(big.Int).SetBytes(record.CallResult.GetUint256(0))
	nNoTokens := new(big.Int).SetBytes(record.CallResult.GetUint256(1))
	nYesTokens2 := new(big.Int).SetBytes(record.CallResult.GetUint256(2))
	nNoTokens2 := new(big.Int).SetBytes(record.CallResult.GetUint256(3))

	log.Printf("Token balances (marketId=%s): %s (yes=%s, no=%s) |  %s (yes=%s, no=%s)", sideYes.MarketId /* yes===no*/, sideYes.EvmAddress, nYesTokens.String(), nNoTokens.String(), sideNo.EvmAddress, nYesTokens2.String(), nNoTokens2.String())

	log.Printf("buyPositionTokensOnBehalfAtomic(marketId=%s, ...) status: %s", sideYes.MarketId, receipt.Status.String())

	/////
	// db
	// - 1. Record the tx on the database (auditing)
	// - 2. record the price on the price table
	// - 3. record the YES/NO balances
	/////

	if h.dbRepository == nil {
		return false, fmt.Errorf("dbRepository is not initialized")
	}

	// 1. record the successful on-chain settlement
	txHash := receipt.TransactionID.String()
	log.Printf("TransactionID (txHash) for successful settlement: %s", txHash)
	err = h.dbRepository.CreateSettlement(sideYes.TxId, sideNo.TxId, txHash)
	if err != nil {
		return false, fmt.Errorf("Error logging a successful tx to settlements table: %v", err)
	}

	// 2. record the price
	err = h.priceRepository.SavePriceHistory(sideYes.MarketId, sideYes.TxId, sideYes.PriceUsd) // TODO - check this
	if err != nil {
		return false, fmt.Errorf("Error saving price history for market %s: %v", sideYes.MarketId, err)
	}
	// don't need to save the No side
	// err = h.dbRepository.SavePriceHistory(sideNo.MarketId, sideNo.PriceUsd)
	// if err != nil {
	// 	return false, fmt.Errorf("Error saving price history for market %s: %v", sideNo.MarketId, err)
	// }

	// 3. record the YES/NO balances
	resultYes, err := h.dbRepository.UpsertUserPositions(sideYes.EvmAddress, sideYes.MarketId, nYesTokens.Int64(), nNoTokens.Int64())
	if err != nil {
		return false, fmt.Errorf("Error upserting user position tokens for %s on market %s: %v", sideYes.EvmAddress, sideYes.MarketId, err)
	}
	fmt.Printf("In marketId=%s, user with evmAddress=%s, has nYes=%d | nNo=%d\n", resultYes.MarketID, resultYes.EvmAddress, resultYes.NYes, resultYes.NNo)
	resultNo, err := h.dbRepository.UpsertUserPositions(sideNo.EvmAddress, sideNo.MarketId, nYesTokens2.Int64(), nNoTokens2.Int64())
	if err != nil {
		return false, fmt.Errorf("Error upserting user position tokens for %s on market %s: %v", sideNo.EvmAddress, sideNo.MarketId, err)
	}
	fmt.Printf("In marketId=%s, user with evmAddress=%s, has nYes=%d | nNo=%d\n", resultNo.MarketID, resultNo.EvmAddress, resultNo.NYes, resultNo.NNo)
	// if we get here, return true
	return true, nil
}

func (h *HederaService) CreateNewMarket(req *pb_api.CreateMarketRequest) (uint64, error) {
	// call the smart contract function createNewMarket(uint128 marketId, string memory _statement)
	marketIdBig, err := lib.Uuid7_to_bigint(req.MarketId)
	if err != nil {
		return 0, fmt.Errorf("failed to convert marketId to bigint: %w", err)
	}
	params := hiero.NewContractFunctionParameters()
	params.AddUint128BigInt(marketIdBig) // marketId
	params.AddString(req.Statement)      // statement

	contractID, err := hiero.ContractIDFromString(
		os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(req.Net))),
	)
	if err != nil {
		return 0, fmt.Errorf("invalid smart contract ID: %v", err)
	}

	log.Printf("Creating a new market on Prism smart contract (%s)", contractID)
	result, err := hiero.NewContractExecuteTransaction().
		SetContractID(contractID).
		SetGas(2_000_000). // TODO - can this be lowered?
		SetFunction("createNewMarket", params).
		Execute(h.hedera_clients[req.Net])
	if err != nil {
		return 0, fmt.Errorf("failed to execute contract: %v", err)
	}

	record, err := result.GetRecord(h.hedera_clients[req.Net])
	if err != nil {
		log.Printf("CreateNewMarket - tx failed (could not get transaction record). Hedera txId = %s. %v", result.TransactionID.String(), err)
		return 0, fmt.Errorf("failed to get transaction record: %v", err)
	}

	// receipt, err := result.GetReceipt(h.hedera_clients[req.Net])
	// if err != nil {
	// 	return fmt.Errorf("failed to get transaction receipt: %v", err)
	// }

	remainingAllowance := new(big.Int).SetBytes(record.CallResult.GetUint256(0))

	log.Printf("Remaining allowance: %v", remainingAllowance.Uint64())

	return remainingAllowance.Uint64(), nil
}
