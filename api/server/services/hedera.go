package services

import (
	"encoding/base64"
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

type HederaKeyType int

const (
	ECDSA HederaKeyType = iota
	ED25519
)

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

/*
*
Function to verify a signature
@param PublicKey publickKey - the public key to verify against
@param byte[] payloadKeccak - the keccak256 hash of the payload (see ExtractPayloadForSigning(...) in sign.go)
@param string sigBase64 - the signature (base64) to verify against
@return bool - true if the signature is valid, false otherwise
*/
func (h *HederaService) VerifySig(publicKey *hiero.PublicKey, payloadKeccak []byte, sigBase64 string) (bool, error) {
	payloadKeccakBase64 := base64.StdEncoding.EncodeToString(payloadKeccak)

	// Construct the exact signed message bytes (Hedera WalletConnect prefix)
	prefixedPayload := []byte(fmt.Sprintf("\x19Hedera Signed Message:\n%d%s", len(payloadKeccakBase64), payloadKeccakBase64)) // note: frontend is signed using base64, so the prefixedPayload should be calculated using base64 and not []byte
	// log.Printf("%s", string(prefixedPayload))

	// Decode Base64 signature
	sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}
	if len(sigBytes) != 64 {
		return false, fmt.Errorf("unexpected signature length: %d", len(sigBytes))
	}

	// Verify signature
	verified := publicKey.VerifySignedMessage(prefixedPayload, sigBytes)
	return verified, nil
}

func (h *HederaService) GetPublicKey(accountId hiero.AccountID) (*hiero.PublicKey, error) {
	// TODO... may get rate limited here...
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s", os.Getenv("HEDERA_NETWORK_SELECTED"), accountId)
	resp, err := lib.Fetch(lib.GET, mirrorNodeURL, nil)

	if err != nil {
		return nil, fmt.Errorf("failed to query mirror node: %v", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("mirror node returned status code %d", resp.StatusCode)
	}

	defer resp.Body.Close()

	var jsonParseResult struct {
		Key struct {
			Key   string `json:"key"`
			Type_ string `json:"_type"`
		} `json:"key"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&jsonParseResult); err != nil {
		return nil, fmt.Errorf("failed to parse mirror node response: %v", err)
	}

	publicKey := &hiero.PublicKey{}
	if strings.HasPrefix(strings.ToUpper(jsonParseResult.Key.Type_), "ECDSA") {
		key, err := hiero.PublicKeyFromStringECDSA(jsonParseResult.Key.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to parse public key (ECDSA) from string: %v", err)
		}
		publicKey = &key
	} else if strings.HasPrefix(strings.ToUpper(jsonParseResult.Key.Type_), "ED25519") {
		key, err := hiero.PublicKeyFromStringEd25519(jsonParseResult.Key.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to parse public key (ED25519) from string: %v", err)
		}
		publicKey = &key
	} else {
		return nil, fmt.Errorf("unsupported key type: %s", jsonParseResult.Key.Type_)
	}

	return publicKey, nil
}

/*
*
This function determines the type of a given Hedera public key (offline).
@param publicKey - the public key to check
*/
func (h *HederaService) PublicKeyType(publicKey *hiero.PublicKey) (HederaKeyType, error) {
	decodedKey, err := base64.StdEncoding.DecodeString(publicKey.String())
	if err != nil {
		log.Fatalf("Failed to decode public key: %v", err)
	}

	switch len(decodedKey) {
	case 32:
		return ED25519, nil
	case 33, 65:
		return ECDSA, nil
	default:
		return -1, fmt.Errorf("unknown key type with length: %d", len(decodedKey))
	}
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

func (h *HederaService) GetEvmAlias(accountId hiero.AccountID) (string, error) {
	info, err := hiero.NewAccountInfoQuery().
		SetAccountID(accountId).
		Execute(h.hedera_client)
	if err != nil {
		return "", fmt.Errorf("GetEvmAlias failed: %w", err)
	}

	return info.ContractAccountID, nil
}

func (h *HederaService) BuyPositionTokens(_accountIdYes string, _accountIdNo string, collateralUsdAbsFloat64 float64, marketIdUuid string, txIdUuidYes string, txIdUuidNo string, sigYesBase64 string, sigNoBase64 string) error {
	// amount := orderRequestClob.PriceUsd * orderRequestClob.NShares

	// implement smart contract interaction to buy shares
	// call function buyPositionTokensOnBehalf(address buyer, uint256 amount) external { ... }
	// Create contract function call
	smartContractIdStr := os.Getenv("SMART_CONTRACT_ID")
	smartContractId, err := hiero.ContractIDFromString(smartContractIdStr)
	if err != nil {
		return fmt.Errorf("invalid SMART_CONTRACT_ID: %w", err)
	}

	accountIdYes, err := hiero.AccountIDFromString(_accountIdYes)
	if err != nil {
		return fmt.Errorf("BuyPositionTokens: invalid AccountId: %w", err)
	}
	accountIdNo, err := hiero.AccountIDFromString(_accountIdNo)
	if err != nil {
		return fmt.Errorf("BuyPositionTokens: invalid AccountId: %w", err)
	}

	evmAliasYes, err := h.GetEvmAlias(accountIdYes)
	if err != nil {
		return fmt.Errorf("failed to get alias key: %v", err)
	}
	evmAliasNo, err := h.GetEvmAlias(accountIdNo)
	if err != nil {
		return fmt.Errorf("failed to get alias key: %v", err)
	}

	// translate variables to suitable format, prior to submission to smart contract:
	marketIdBigInt, err := lib.Uuid7_to_bigint(marketIdUuid)
	if err != nil {
		return fmt.Errorf("failed to convert marketId to bigint: %w", err)
	}

	collateralUsd_abs_scaled_bigint, err := lib.FloatToBigIntScaledDecimals(collateralUsdAbsFloat64)
	if err != nil {
		return fmt.Errorf("failed to scale collateral USD: %w", err)
	}

	txIdUuidYesBigInt, err := lib.Uuid7_to_bigint(txIdUuidYes)
	if err != nil {
		return fmt.Errorf("failed to convert txIdUuidYes to bigint: %w", err)
	}
	txIdUuidNoBigInt, err := lib.Uuid7_to_bigint(txIdUuidNo)
	if err != nil {
		return fmt.Errorf("failed to convert txIdUuidNo to bigint: %w", err)
	}

	sigYesBytes, err := base64.StdEncoding.DecodeString(sigYesBase64)
	if err != nil {
		return fmt.Errorf("failed to decode sigYesBase64: %w", err)
	}
	sigNoBytes, err := base64.StdEncoding.DecodeString(sigNoBase64)
	if err != nil {
		return fmt.Errorf("failed to decode sigNoBase64: %w", err)
	}

	// set up the smart contract parameters:
	// note:
	// UUIDv7 fits into a 128-bit unsigned integer register
	// hiero.ToPaddedBytes(someBigUintAbs, 16) // 16 * 8-bits = 128-bit uint
	// hiero.ToPaddedBytes(someBigUintAbs, 32) // 32 * 8-bits = 256-bit uint
	params := hiero.NewContractFunctionParameters()
	params.AddUint128(hiero.ToPaddedBytes(marketIdBigInt, 16))                  // marketId: uint128
	params.AddAddress(evmAliasYes)                                              // signerYes: address
	params.AddAddress(evmAliasNo)                                               // signerNo: address
	params.AddUint256(hiero.ToPaddedBytes(collateralUsd_abs_scaled_bigint, 32)) // collateralUsdcAbs: uint256
	params.AddUint128(hiero.ToPaddedBytes(txIdUuidYesBigInt, 16))               // txIdYes: uint128
	params.AddUint128(hiero.ToPaddedBytes(txIdUuidNoBigInt, 16))                // txIdNo: uint128
	params.AddBytes(sigYesBytes)                                                // sigYes: bytes (calldata)
	params.AddBytes(sigNoBytes)                                                 // sigNo: bytes (calldata)

	log.Printf("Attempting to allocate position tokens on-chain (marketId=%s): accountIdYes=%s, accountIdNo=%s, collateralUsdAbs=%f, txIdYesUuid=%s (sigYesBase64=%s), txIdNoUuid=%s (sigNoBase64=%s)", marketIdUuid, evmAliasYes, evmAliasNo, collateralUsdAbsFloat64, txIdUuidYes, sigYesBase64, txIdUuidNo, sigNoBase64)

	contractCall := hiero.NewContractExecuteTransaction().
		SetContractID(smartContractId).
		SetGas(2_000_000). // paid by us...
		SetFunction("buyPositionTokensOnBehalfAtomic", params)

	// Execute transaction
	txResponse, err := contractCall.Execute(h.hedera_client)
	if err != nil {
		return fmt.Errorf("failed to execute contract call: %w", err)
		// TODO - put the order back on the CLOB?...
	}

	// Get receipt
	receipt, err := txResponse.GetReceipt(h.hedera_client)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %w", err)
		// TODO - put the order back on the CLOB?...
	}

	if receipt.Status != hiero.StatusSuccess {
		return fmt.Errorf("contract execution failed with status: %s", receipt.Status)
		// TODO - put the order back on the CLOB?...
	}

	log.Printf("Successfully sent $USDC%d collateral from both accountId=%s (YES) and accountId=%s (NO). Hedera txId: %s", collateralUsd_abs_scaled_bigint.Uint64(), _accountIdYes, _accountIdNo, txResponse.TransactionID.String())
	return nil
}
