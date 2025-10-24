package services

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	pb "api/gen"
	"api/server/lib"
)

func SubmitPredictionIntent(req *pb.PredictionIntentRequest) (string, error) {
	// validations
	// - req.AccountId is a valid Hedera account ID
	//   req.AccountId has a value >= 0.0.1000
	// - req.Utc is a valid RFC3339 timestamp is no later than last 5 minutes in the past, no futher than 30 seconds into the future
	// - req.Signature is valid for req.AccountId's public key
	// - ensure req.AccountId has provided the smart contract with an allowance >= (req.PriceUsd * req.NShares)

	accountId := req.AccountId

	// Validate account ID format and minimum account number
	parts := strings.Split(accountId, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid account ID format: %s", accountId)
	}

	accountNum, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil {
		return "", fmt.Errorf("invalid account number in account ID: %s", accountId)
	}

	if accountNum < 1000 {
		return "", fmt.Errorf("account number must be >= 1000, got: %d", accountNum)
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

	isValidSig, err := lib.VerifySignature(publicKey.Key, req.Utc, req.Sig)
	if err != nil {
		return "", fmt.Errorf("failed to verify signature: %v", err)
	}
	if !isValidSig {
		return "", fmt.Errorf("invalid signature")
	}

	// ensure we have an allowance
	// spenderAllowanceUsd, err := lib.GetSpenderAllowanceUsd(hiero.LedgerIDFromString(req.AccountId))
	// if err != nil {
	// 	return "", fmt.Errorf("failed to get spender allowance: %v", err)
	// }

	/// OK - now you can put the order on the CLOB
	return fmt.Sprintf("Processed input for user %s", req.AccountId), nil
}
