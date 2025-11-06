package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	pb "api/gen"
	clob "api/gen/clob"
	"api/server/lib"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

func SubmitPredictionIntent(req *pb.PredictionIntentRequest) (string, error) {
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
	timestamp, err := time.Parse(time.RFC3339, req.Utc)
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
		return "", fmt.Errorf("timestamp is too old: %s", req.Utc)
	}

	if timestamp.After(futureDelta) {
		return "", fmt.Errorf("timestamp is too far in the future: %s. Now: %s", req.Utc, now)
	}

	// Validate signature against public key from mirror node
	// First look up the Hedera accountId against the mirror node
	publicKey, err := lib.GetPublicKey(accountId)
	if err != nil {
		return "", fmt.Errorf("failed to get public key: %v", err)
	}
	log.Printf("Mirror node response for account %s on network %s: %s %s", accountId, os.Getenv("HEDERA_NETWORK_SELECTED"), publicKey.Key, publicKey.KeyType)

	// Serialize the request for signature verification
	serializedMessageSansSigBase64, err := lib.SerializePredictionRequest_SansSig_ForSigning(req)
	if err != nil {
		return "", fmt.Errorf("failed to serialize request for signing: %v", err)
	}

	// Deserialize the message
	deserializedMessageUTF8, err := lib.DeserializePredictionRequestFromSigning(serializedMessageSansSigBase64)
	if err != nil {
		log.Printf("Failed to deserialize message for logging: %v", err)
		deserializedMessageUTF8 = "Failed to deserialize"
	}

	// log.Printf("\n- publicKey.Key: %s\n- serializedMessageSansSigBase64: %s\n- deserialized message UTF8: %s\n- req.Sig: %s", publicKey.Key, serializedMessageSansSigBase64, deserializedMessageUTF8, req.Sig)

	isValidSig, err := lib.VerifySignature(publicKey.Key, deserializedMessageUTF8, req.Sig)
	if err != nil {
		log.Printf("Failed to verify signature: %v", err)
		return "", fmt.Errorf("failed to verify signature: %v", err)
	}
	if !isValidSig {
		log.Printf("Invalid signature for account %s", req.AccountId)
		return "", fmt.Errorf("invalid signature")
	}

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

	spenderAllowanceUsd, err := lib.GetSpenderAllowanceUsd(*_networkSelected, accountId, _smartContractId, usdcAddress, usdcDecimals)
	if err != nil {
		return "", fmt.Errorf("failed to get spender allowance: %v", err)
	}
	log.Printf(("Spender allowance for account %s on contract %s: $%.2f"), accountId.String(), _smartContractId.String(), spenderAllowanceUsd)
	if spenderAllowanceUsd < (req.GetPriceUsd() * req.GetNShares()) {
		return "", fmt.Errorf("Spender allowance ($USD%.2f) too low for this predictionIntent ($USD%.2f)", spenderAllowanceUsd, req.GetPriceUsd()*req.GetNShares())
	}

	/// OK - now you can put the order on the CLOB
	clobRequest := &clob.OrderRequest{
		TxId:        req.TxId,
		MarketId:    req.MarketId,
		AccountId:   req.AccountId,
		MarketLimit: req.MarketLimit,
		PriceUsd:    req.PriceUsd,
		NShares:     req.NShares,
	}

	// TODO: Implement CLOB client connection and call
	// This would typically involve creating a gRPC client to the CLOB service
	// and calling the PlaceOrder method with the clobRequest
	log.Printf("Would place order on CLOB: tx_id=%s, market_id=%s, account_id=%s, market_limit=%s, price=%.2f, n_shares=%.2f",
		clobRequest.TxId, clobRequest.MarketId, clobRequest.AccountId, clobRequest.MarketLimit, clobRequest.PriceUsd, clobRequest.NShares)

	// Publish to NATS
	natsConn, err := lib.GetNATSConnection()
	if err != nil {
		return "", fmt.Errorf("failed to connect to NATS: %v", err)
	}
	defer natsConn.Close()

	// Marshal the CLOB request to JSON
	clobRequestJSON, err := json.Marshal(clobRequest)
	if err != nil {
		return "", fmt.Errorf("failed to marshal CLOB request: %v", err)
	}

	// Publish to NATS subject
	subject := "clob.orders"
	err = natsConn.Publish(subject, clobRequestJSON)
	if err != nil {
		return "", fmt.Errorf("failed to publish to NATS: %v", err)
	}

	log.Printf("Published order to NATS subject '%s': %s", subject, string(clobRequestJSON))

	return fmt.Sprintf("Processed input for user %s", req.AccountId), nil
}
