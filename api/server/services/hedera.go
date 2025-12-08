package services

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strings"

	"os"

	"api/server/lib"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type HederaService struct {
	hedera_client *hiero.Client
}

// type PublicKey struct {
// 	KeyType string
// 	Key     string
// }

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
	log.Println("Hedera initialized successfully")
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
	// const keccakHex = keccak256(Buffer.from(payloadHex, 'hex')).slice(2)
	// const keccak = Buffer.from(keccakHex, 'hex')
	// const keccak64 = keccak.toString('base64') // an extra step...
	// const keccakPrefixedStr = prefixMessageToSign(keccak64)
	// console.log(`keccakPrefixedStr (hex): ${Buffer.from(keccakPrefixedStr, 'utf-8').toString('hex')}`)

	keccak64 := base64.StdEncoding.EncodeToString(keccak)
	keccak64PrefixedStr := lib.PrefixMessageToSign(keccak64)
	// log.Printf("keccak64 (base64) calc'd on back-end: %s", keccak64)
	// log.Printf("keccak64 (hex) calc'd on back-end: %x", keccak64)
	// fmt.Printf("keccakPrefixedStr: %s\n", keccak64PrefixedStr)
	// fmt.Printf("keccakPrefixedStr (hex): %s\n", hex.EncodeToString([]byte(keccak64PrefixedStr)))

	// Now verify the signature
	isValid := publicKey.VerifySignedMessage([]byte(keccak64PrefixedStr), sig)
	if isValid {
		return true, nil
	}
	return false, fmt.Errorf("Invalid signature")
}

// OLD - hashpack utf-8 sig verification
// func (h *HederaService) Verify(publicKey *hiero.PublicKey, payloadUtf8 string, sigBase64 string) (bool, error) {
// 	sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
// 	if err != nil {
// 		return false, fmt.Errorf("failed to decode signature: %w", err)
// 	}

// 	keccak := lib.Keccak256([]byte(payloadUtf8))
// 	// keccakHex := hex.EncodeToString(keccak)
// 	keccakHex := fmt.Sprintf("%x", keccak)
// 	log.Printf("keccak (hex) calc'd on back-end: %x", keccak)

// 	log.Printf("sig: %x", sigBytes)

// 	N := len([]rune(string(keccak)))
// 	keccakPrefixedUtf8 := lib.PrefixMessageToSign(keccakHex, N)
// 	fmt.Printf("keccakPrefixedUtf8: %s\n", keccakPrefixedUtf8)

// 	sigHex := fmt.Sprintf("%x", sigBytes)
// 	sig := make([]byte, len(sigHex)/2)
// 	_, err = hex.Decode(sig, []byte(sigHex))
// 	if err != nil {
// 		return false, fmt.Errorf("Error decoding signature hex: %v", err)
// 	}

// 	// Verify signature
// 	isValid := publicKey.VerifySignedMessage([]byte(keccakPrefixedUtf8), sig)
// 	if isValid {
// 		return true, nil
// 	}
// 	return false, fmt.Errorf("Invalid signature")
// }

// /*
// *
// Function to verify a signature
// @param PublicKey publickKey - the public key to verify against
// @param byte[] serializedPayload - the serialisedPayload - see sign.go
// @param string sigBase64 - the signature (base64) to verify against
// @return bool - true if the signature is valid, false otherwise
// */
// func (h *HederaService) VerifySig(publicKey *hiero.PublicKey, serializedPayload []byte, sigBase64 string) (bool, error) {
// 	// keccak256 hash of the serialized payload
// 	payloadKeccak := lib.Keccak256(serializedPayload)
// 	log.Printf("payloadKeccak (hex) (len=%d): %x", len(payloadKeccak), payloadKeccak)

// 	// Decode Base64 signature
// 	sig, err := base64.StdEncoding.DecodeString(sigBase64)
// 	if err != nil {
// 		return false, fmt.Errorf("failed to decode signature: %w", err)
// 	}
// 	if len(sig) != 64 {
// 		return false, fmt.Errorf("unexpected signature length: %d", len(sig))
// 	}

// 	// Construct the exact signed message bytes (Hedera WalletConnect prefix)
// 	// N.B. the payload is prefixed!
// 	prefix := "\x19Hedera Signed Message:\n"
// 	prefixedPayload := append([]byte(prefix), byte(len(payloadKeccak))) // Append raw byte length
// 	prefixedPayload = append(prefixedPayload, payloadKeccak...)
// 	log.Printf("prefixedPayload (hex) (len=%d):%x", len(prefixedPayload), prefixedPayload)

// 	log.Printf(publicKey.StringRaw())
// 	log.Printf("serializedPayload (hex) (len=%d): %x", len(serializedPayload), serializedPayload)
// 	log.Printf("%v", publicKey.VerifySignedMessage(prefixedPayload, sig))
// 	log.Printf("%v", publicKey.VerifySignedMessage(crypto.Keccak256(prefixedPayload), sig))
// 	log.Printf("%v", publicKey.VerifySignedMessage(payloadKeccak, sig))
// 	log.Printf("%v", publicKey.VerifySignedMessage(serializedPayload, sig))

// 	// Verify signature
// 	verified := publicKey.VerifySignedMessage(prefixedPayload, sig) // note: The hiero Golang library will again calc the keccak256 of the prefixed message
// 	return verified, nil
// }

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

// /*
// *
// This function determines the type of a given Hedera public key (offline).
// @param publicKey - the public key to check
// */
// func (h *HederaService) PublicKeyType(publicKey *hiero.PublicKey) (HederaKeyType, error) {
// 	decodedKey, err := base64.StdEncoding.DecodeString(publicKey.String())
// 	if err != nil {
// 		log.Fatalf("Failed to decode public key: %v", err)
// 	}

// 	switch len(decodedKey) {
// 	case 32:
// 		return ED25519, nil
// 	case 33, 65:
// 		return ECDSA, nil
// 	default:
// 		return -1, fmt.Errorf("unknown key type with length: %d", len(decodedKey))
// 	}
// }

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

// func (h *HederaService) GetEvmAlias(accountId hiero.AccountID) (string, error) {
// 	info, err := hiero.NewAccountInfoQuery().
// 		SetAccountID(accountId).
// 		Execute(h.hedera_client)
// 	if err != nil {
// 		return "", fmt.Errorf("GetEvmAlias failed: %w", err)
// 	}

// 	return info.ContractAccountID, nil
// }

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

	// do we need to flip which accoundId is YES and which accountId is NO?
	if origPriceUsdNo < 0 && origPriceUsdYes > 0 { // Yes side get YES position tokens, No side gets NO position tokens
		// canonical situation - the ordering is correct as-is
	} else if origPriceUsdYes < 0 && origPriceUsdNo > 0 { // Yes side gets NO position tokens, No side gets YES position tokens
		origQtyYes, origQtyNo = origQtyNo, origQtyYes
		origPriceUsdYes, origPriceUsdNo = origPriceUsdNo, origPriceUsdYes
		accountIdYes, accountIdNo = accountIdNo, accountIdYes
		txIdUuidYes, txIdUuidNo = txIdUuidNo, txIdUuidYes
		sigYes64, sigNo64 = sigNo64, sigYes64
		publicKeyYesHex, publicKeyNoHex = publicKeyNoHex, publicKeyYesHex
		evmYes, evmNo = evmNo, evmYes
		keyTypeYes, keyTypeNo = keyTypeNo, keyTypeYes
	} else {
		// all other situations (including == 0.0) can never happen:
		return false, fmt.Errorf("invalid price_usd values for YES and NO positions: %f, %f", origPriceUsdYes, origPriceUsdNo)
	}

	// For signature verification, we need seperate reconstruction of the payloads for YES and NO positions, including collateralUsd
	collateralUsdAbsYes := math.Abs(origPriceUsdYes * origQtyYes)
	collateralUsdAbsScaledYes, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsYes)
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsYes: %v", err)
	}

	// For signature verification, we need seperate reconstruction of the payloads for YES and NO positions, including collateralUsd
	collateralUsdAbsNo := math.Abs(origPriceUsdNo * origQtyNo)
	collateralUsdAbsScaledNo, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsNo)
	if err != nil {
		return false, fmt.Errorf("failed to scale collateralUsdAbsNo: %v", err)
	}

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

	// partial fills MUST take the *lower* Usd collateral value
	collateralUsdAbsScaledMin := collateralUsdAbsScaledYes
	if collateralUsdAbsScaledNo.Cmp(collateralUsdAbsScaledYes) < 0 {
		collateralUsdAbsScaledMin = collateralUsdAbsScaledNo
	}

	// sigObjYes and sigObjNo (Hedera format signature objects)
	sigObjYes, err := lib.BuildSignatureMap(publicKeyYes, sigYes, lib.HederaKeyType(keyTypeYes))
	sigObjNo, err := lib.BuildSignatureMap(publicKeyNo, sigNo, lib.HederaKeyType(keyTypeNo))
	log.Printf("sigYes (keyType=%d) (hex): %x", keyTypeYes, sigYes)
	log.Printf("sigNo (keyType=%d) (hex): %x", keyTypeNo, sigNo)

	params := hiero.NewContractFunctionParameters()
	// uint128 marketId,
	// address signerYes,
	// address signerNo,
	// uint256 collateralUsdAbsScaled,
	// uint128 txIdYes,
	// uint128 txIdNo,
	// bytes calldata sigObjYes,
	// bytes calldata sigObjNo
	params.AddUint128BigInt(marketIdBig)               // marketId
	params.AddAddress(accountIdYes)                    // signerYes
	params.AddAddress(accountIdNo)                     // signerNo
	params.AddUint256BigInt(collateralUsdAbsScaledMin) //collateralUsdAbsScaled
	params.AddUint128BigInt(txIdYesBig)                // txIdYes
	params.AddUint128BigInt(txIdNoBig)                 // txIdNo
	params.AddUint128(sigObjYes)                       // sigObjYes
	params.AddUint128(sigObjNo)                        // sigObjNo

	log.Printf("Prepared smart contract parameters for BuyPositionTokens")
	log.Println("marketIdBig:", marketIdBig.String())
	log.Println("accountIdYes:", accountIdYes)
	log.Println("accountIdNo:", accountIdNo)
	log.Println("collateralUsdAbsScaledYes:", collateralUsdAbsScaledYes.String())
	log.Println("txIdYesBig:", txIdYesBig.String())
	log.Println("txIdNoBig:", txIdNoBig.String())
	log.Printf("sigObjYes (len=%d): %x", len(sigObjYes), sigObjYes)
	log.Printf("sigObjNo (len=%d): %x", len(sigObjNo), sigObjNo)

	/////
	// db
	// Record the tx on the database (auditing)
	/////

	return false, nil
}

// func (h *HederaService) BuyPositionTokensOld(_accountIdYes string, _accountIdNo string, collateralUsdAbsFloat64 float64, marketIdUuid string, txIdUuidYes string, txIdUuidNo string, sigYes []byte, sigNo []byte) error {
// 	// amount := orderRequestClob.PriceUsd * orderRequestClob.NShares

// 	// implement smart contract interaction to buy shares
// 	// call function buyPositionTokensOnBehalf(address buyer, uint256 amount) external { ... }
// 	// Create contract function call
// 	smartContractIdStr := os.Getenv("SMART_CONTRACT_ID")
// 	smartContractId, err := hiero.ContractIDFromString(smartContractIdStr)
// 	if err != nil {
// 		return fmt.Errorf("invalid SMART_CONTRACT_ID: %w", err)
// 	}

// 	accountIdYes, err := hiero.AccountIDFromString(_accountIdYes)
// 	if err != nil {
// 		return fmt.Errorf("BuyPositionTokens: invalid AccountId: %w", err)
// 	}
// 	accountIdNo, err := hiero.AccountIDFromString(_accountIdNo)
// 	if err != nil {
// 		return fmt.Errorf("BuyPositionTokens: invalid AccountId: %w", err)
// 	}

// 	evmAliasYes, err := h.GetEvmAlias(accountIdYes)
// 	if err != nil {
// 		return fmt.Errorf("failed to get alias key: %v", err)
// 	}
// 	evmAliasNo, err := h.GetEvmAlias(accountIdNo)
// 	if err != nil {
// 		return fmt.Errorf("failed to get alias key: %v", err)
// 	}

// 	// translate variables to suitable format, prior to submission to smart contract:
// 	// marketIdBigInt, err := lib.Uuid7_to_bigint(marketIdUuid)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to convert marketId to bigint: %w", err)
// 	// }

// 	// collateralUsd_abs_scaled_bigint, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsFloat64)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to scale collateral USD: %w", err)
// 	// }

// 	// txIdUuidYesBigInt, err := lib.Uuid7_to_bigint(txIdUuidYes)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to convert txIdUuidYes to bigint: %w", err)
// 	// }
// 	// txIdUuidNoBigInt, err := lib.Uuid7_to_bigint(txIdUuidNo)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to convert txIdUuidNo to bigint: %w", err)
// 	// }

// 	// sigYesBytes, err := base64.StdEncoding.DecodeString(sigYesBase64)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to decode sigYesBase64: %w", err)
// 	// }
// 	// sigNoBytes, err := base64.StdEncoding.DecodeString(sigNoBase64)
// 	// if err != nil {
// 	// 	return fmt.Errorf("failed to decode sigNoBase64: %w", err)
// 	// }

// 	// set up the smart contract parameters:
// 	// note:
// 	// UUIDv7 fits into a 128-bit unsigned integer register
// 	// hiero.ToPaddedBytes(someBigUintAbs, 16) // 16 * 8-bits = 128-bit uint
// 	// hiero.ToPaddedBytes(someBigUintAbs, 32) // 32 * 8-bits = 256-bit uint
// 	log.Printf("marketIdBigInt (bigint.String()): %s", marketIdBigInt.String())
// 	log.Printf("marketIdBigInt (hex): %x", marketIdBigInt)
// 	log.Printf("evmAliasYes: %s", evmAliasYes)
// 	log.Printf("evmAliasNo: %s", evmAliasNo)
// 	log.Printf("collateralUsdAbsFloat64: %f", collateralUsdAbsFloat64)
// 	log.Printf("collateralUsd_abs_scaled_bigint: %s", collateralUsd_abs_scaled_bigint.String())
// 	log.Printf("sigYes (hex) (len=%d): %x", len(sigYes), sigYes)
// 	log.Printf("sigNo (hex) (len=%d): %x", len(sigNo), sigNo)
// 	params := hiero.NewContractFunctionParameters()
// 	params.AddUint128BigInt(marketIdBigInt)                  // marketId: uint256
// 	params.AddAddress(evmAliasYes)                           // signerYes: address
// 	params.AddAddress(evmAliasNo)                            // signerNo: address
// 	params.AddUint256BigInt(collateralUsd_abs_scaled_bigint) // collateralUsdcAbs: uint256
// 	params.AddUint128BigInt(txIdUuidYesBigInt)               // txIdYes: uint128
// 	params.AddUint128BigInt(txIdUuidNoBigInt)                // txIdNo: uint128
// 	params.AddBytes(sigYesBytes)                             // sigYes: bytes (calldata)
// 	params.AddBytes(sigNoBytes)                              // sigNo: bytes (calldata)

// 	log.Printf("Attempting to allocate position tokens on-chain (marketId=%s): accountIdYes=%s, accountIdNo=%s, collateralUsdAbs=%f, txIdYesUuid=%s (sigYesBase64=%s), txIdNoUuid=%s (sigNoBase64=%s)", marketIdUuid, evmAliasYes, evmAliasNo, collateralUsdAbsFloat64, txIdUuidYes, sigYesBase64, txIdUuidNo, sigNoBase64)

// 	contractCall := hiero.NewContractExecuteTransaction().
// 		SetContractID(smartContractId).
// 		SetGas(10_000_000). // paid by us...
// 		SetFunction("buyPositionTokensOnBehalfAtomic", params)

// 	// Execute transaction
// 	txResponse, err := contractCall.Execute(h.hedera_client)
// 	if err != nil {
// 		return fmt.Errorf("failed to execute contract call (contractId=%s): %w", smartContractIdStr, err)
// 		// TODO - put the order back on the CLOB?...
// 	}

// 	// Get receipt
// 	receipt, err := txResponse.GetReceipt(h.hedera_client)
// 	if err != nil {
// 		return fmt.Errorf("failed to get receipt (contractId=%s): %w", smartContractIdStr, err)
// 		// TODO - put the order back on the CLOB?...
// 	}

// 	if receipt.Status != hiero.StatusSuccess {
// 		return fmt.Errorf("contract execution failed with status (contractId=%s): %s", smartContractIdStr, receipt.Status)
// 		// TODO - put the order back on the CLOB?...
// 	}

// 	log.Printf("Successfully sent $USDC %d (scaled with USDC decimals) collateral from both accountId=%s (YES) and accountId=%s (NO). Smart contract Id: %s. Hedera txId: %s", collateralUsd_abs_scaled_bigint.Uint64(), _accountIdYes, _accountIdNo, smartContractIdStr, txResponse.TransactionID.String())
// 	return nil
// }
