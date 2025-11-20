package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"time"

	pb_api "api/gen"
	"api/server/lib"

	"github.com/google/uuid"
	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type Hashi struct {
	dbService     *DbService
	natsService   *NatsService
	hederaService *HederaService
}

func (h *Hashi) InitHashi(dbService *DbService, natsService *NatsService, hederaService *HederaService) {
	h.dbService = dbService
	h.natsService = natsService
	h.hederaService = hederaService

	log.Println("Hashi initialized successfully")
}

func (h *Hashi) SubmitPredictionIntent(req *pb_api.PredictionIntentRequest) (string, error) {
	// validations
	// - req.AccountId is a valid Hedera account ID
	//   req.AccountId has a value >= 0.0.1000
	// - req.Utc is a valid RFC3339 timestamp is no later than last 5 minutes in the past, no futher than 30 seconds into the future
	// - req.Signature is valid for req.AccountId's public key
	// - ensure req.AccountId has provided the smart contract with an allowance >= (req.PriceUsd * req.NShares)

	// Validate account ID format and minimum account number
	accountId, err := hiero.AccountIDFromString(req.AccountId)
	if err != nil {
		return "Invalid accountId format", err
	}

	// Validate timestamp is within the last TIMESTAMP_ALLOWED_PAST_SECONDS seconds
	timestamp, err := time.Parse(time.RFC3339, req.GeneratedAt)
	if err != nil {
		return "", fmt.Errorf("invalid timestamp format: %v", err)
	}

	now := time.Now().UTC()
	allowedPastSeconds, err := strconv.Atoi(os.Getenv("TIMESTAMP_ALLOWED_PAST_SECONDS"))
	if err != nil {
		return "", fmt.Errorf("invalid TIMESTAMP_ALLOWED_PAST_SECONDS environment variable: %v", err)
	}
	allowedFutureSeconds, err := strconv.Atoi(os.Getenv("TIMESTAMP_ALLOWED_FUTURE_SECONDS"))
	if err != nil {
		return "", fmt.Errorf("invalid TIMESTAMP_ALLOWED_FUTURE_SECONDS environment variable: %v", err)
	}
	pastDelta := now.Add(-1 * time.Duration(allowedPastSeconds) * time.Second)
	futureDelta := now.Add(time.Duration(allowedFutureSeconds) * time.Second)

	if timestamp.Before(pastDelta) {
		return "", fmt.Errorf("timestamp is too old: %s", req.GeneratedAt)
	}

	if timestamp.After(futureDelta) {
		return "", fmt.Errorf("timestamp is too far in the future: %s. Now: %s", req.GeneratedAt, now)
	}

	// check we haven't received this txid previously
	txUUID, err := uuid.Parse(req.TxId)
	if err != nil {
		return "", fmt.Errorf("invalid txId uuid: %v", err)
	}
	exists, err := h.dbService.IsDuplicateTxId(txUUID)
	if err != nil {
		return "", fmt.Errorf("failed to check existing txId: %v", err)
	}
	if exists {
		log.Printf("DUPLICATE: %s", req.TxId)
		return "", fmt.Errorf("duplicate txId: %s", req.TxId)
	}

	// Validate signature against public key from mirror node
	// First look up the Hedera accountId against the mirror node
	publicKey, err := h.hederaService.GetPublicKey(accountId)
	if err != nil {
		return "", fmt.Errorf("failed to get public key: %v", err)
	}
	log.Printf("Mirror node response for account %s on network %s: %s", accountId, os.Getenv("HEDERA_NETWORK_SELECTED"), publicKey.String())

	serializedPayload, err := lib.ExtractPayloadForSigning(req)
	if err != nil {
		return "", fmt.Errorf("failed to extract payload for signing: %v", err)
	}
	// // log.Printf("*** Serialized payload for signing (hex): %x", serializedPayload)
	// log.Printf("*** Serialized payload for signing (base64): %s", base64.StdEncoding.EncodeToString(serializedPayload))
	// // log.Printf("*** serializedPayload len=%d\n", len(serializedPayload))

	keccakHash := lib.Keccak256(serializedPayload)
	// // log.Printf("*** Keccak-256 hash of payload (hex): %x", keccakHash)
	// log.Printf("*** Server extracted the payload according to the format and generated the Keccak-256 hash")
	// log.Printf("*** resulting Keccak-256: %s", base64.StdEncoding.EncodeToString(keccakHash))

	// testPayload := []byte{0x01, 0x02, 0x03}
	// keccakTest := lib.Keccak256(testPayload)
	// log.Printf("*** TEST payload (hex): %x", testPayload)
	// log.Printf("*** TEST Keccak-256 hash (hex): %x", keccakTest)

	// Serialize the request for sig check
	// serializedSansSigBase64, err := lib.Serialize64PredictionRequest_SansSig_ForSigning(req)
	// if err != nil {
	// 	return "", fmt.Errorf("failed to serialize request for signing: %v", err)
	// }
	// // to bytes for sig check
	// serializedSansSigBytes, err := base64.StdEncoding.DecodeString(serializedSansSigBase64)
	// if err != nil {
	// 	return "", fmt.Errorf("failed to decode base64: %v", err)
	// }
	// serializedSansSigUTF8 := string(serializedSansSigBytes)
	// log.Printf("Serialized message sans sig (UTF8): %s", serializedSansSigUTF8)

	log.Printf("Parameters passed to VerifySig(...): \n\t- publicKey (hex, looked up): %s\n\t- payloadKeccak (base64, calculated server-side based on payload): %s\n\t- sig (base64, extracted from payload): %s\n", publicKey.String(), base64.StdEncoding.EncodeToString(keccakHash), req.Sig)
	isValidSig, err := h.hederaService.VerifySig(publicKey, keccakHash, req.Sig)
	// isValidSig, err := h.hederaService.VerifySignature(publicKey.String(), base64.StdEncoding.EncodeToString(keccakHash), req.Sig)

	if err != nil {
		log.Printf("Failed to verify signature: %v", err)
		return "", fmt.Errorf("failed to verify signature: %v", err)
	}
	if !isValidSig {
		log.Printf("Invalid signature for account %s", req.AccountId)
		return "", fmt.Errorf("invalid signature")
	}
	// isValidSig, err := h.hederaService.VerifySignature(publicKey.Key, serializedSansSigUTF8, req.Sig)
	// if err != nil {
	// 	log.Printf("Failed to verify signature: %v", err)
	// 	return "", fmt.Errorf("failed to verify signature: %v", err)
	// }
	// if !isValidSig {
	// 	log.Printf("Invalid signature for account %s", req.AccountId)
	// 	return "", fmt.Errorf("invalid signature")
	// }

	log.Printf("**Signature is valid for account %s**", req.AccountId)

	// ensure we have an allowance
	_networkSelected, err := hiero.LedgerIDFromString(os.Getenv("HEDERA_NETWORK_SELECTED"))
	if err != nil {
		return "", fmt.Errorf("failed to get network selected: %v", err)
	}
	_smartContractId, err := hiero.ContractIDFromString(os.Getenv("SMART_CONTRACT_ID"))
	if err != nil {
		return "", fmt.Errorf("failed to validate SMART_CONTRACT_ID: %v", err)
	}
	usdcAddress, err := hiero.ContractIDFromString(os.Getenv("USDC_ADDRESS"))
	if err != nil {
		return "", fmt.Errorf("failed to validate USDC_ADDRESS: %v", err)
	}
	usdcDecimals, err := strconv.ParseUint(os.Getenv("USDC_DECIMALS"), 10, 64)
	if err != nil {
		return "", fmt.Errorf("failed to parse USDC_DECIMALS: %v", err)
	}

	spenderAllowanceUsd, err := h.hederaService.GetSpenderAllowanceUsd(*_networkSelected, accountId, _smartContractId, usdcAddress, usdcDecimals)
	if err != nil {
		return "", fmt.Errorf("failed to get spender allowance: %v", err)
	}
	log.Printf(("Spender allowance for account %s on contract %s: $%.2f"), accountId.String(), _smartContractId.String(), spenderAllowanceUsd)
	if spenderAllowanceUsd < math.Abs(req.GetPriceUsd()*req.GetQty()) {
		log.Printf("ERROR: Spender allowance ($USD%.2f) too low for this predictionIntent ($USD%.2f)", spenderAllowanceUsd, req.GetPriceUsd()*req.GetQty())
		return "", fmt.Errorf("Spender allowance ($USD%.2f) too low for this predictionIntent ($USD%.2f)", spenderAllowanceUsd, req.GetPriceUsd()*req.GetQty())
	}

	/// OK - now you can put the order on the CLOB
	/// All validations passed

	// store the OrderRequest in the database
	h.dbService.SaveOrderRequest(req)

	// Marshal the CLOB req: *pb_api.PredictionIntentRequest to JSON
	clobRequestJSON, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal CLOB request: %v", err)
	}

	err = h.natsService.Publish(lib.SUBJECT_CLOB_ORDERS, clobRequestJSON)
	if err != nil {
		return "", fmt.Errorf("failed to publish to NATS: %v", err)
	}

	log.Printf("Published order to NATS subject '%s': %s", lib.SUBJECT_CLOB_ORDERS, string(clobRequestJSON))

	return fmt.Sprintf("Processed input for user %s", req.AccountId), nil
}
