package services

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"strings"
	"time"

	pb_api "api/gen"
	pb_clob "api/gen/clob"
	"api/server/lib"
	repositories "api/server/repositories"

	"github.com/google/uuid"
	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type Prism struct {
	dbRepository  *repositories.DbRepository
	natsService   *NatsService
	hederaService *HederaService
	marketService *MarketService
}

func (p *Prism) InitPrism(dbRepository *repositories.DbRepository, natsService *NatsService, hederaService *HederaService, marketService *MarketService) {
	p.dbRepository = dbRepository
	p.natsService = natsService
	p.hederaService = hederaService
	p.marketService = marketService

	log.Println("Prism service initialized successfully")
}

func (p *Prism) SubmitPredictionIntent(req *pb_api.PredictionIntentRequest) (string, error) {
	/////
	// validations
	/////
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

	// TODO - validate the evmAddress is 20 bytes hex
	// TODO - validate the publicKey is valid
	// TODO - validate the publicKey type is valid

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
	exists, err := p.dbRepository.IsDuplicateTxId(txUUID)
	if err != nil {
		return "", fmt.Errorf("failed to check existing txId: %v", err)
	}
	if exists {
		log.Printf("DUPLICATE txId: %s", req.TxId)
		return "", fmt.Errorf("duplicate txId: %s", req.TxId)
	}

	// validate that the network sent is valid
	netSelectedByUser := strings.ToLower(req.Net)
	if !lib.IsValidNetwork(netSelectedByUser) {
		return "", fmt.Errorf("invalid network: %s", req.Net)
	}

	// First look up the Hedera accountId against the mirror node
	publicKeyLookedUp, keyTypeLookedUp, err := p.hederaService.GetPublicKey(accountId, netSelectedByUser)
	if err != nil {
		return "", fmt.Errorf("failed to get public key: %v", err)
	}
	log.Printf("Mirror node response for account %s on network %s: %s", accountId, netSelectedByUser, publicKeyLookedUp.String())

	// keyType sent from the front-end (no 0x prefix) must match the keyType looked up on the mirror node
	if !lib.IsValidKeyType(req.KeyType) {
		return "", fmt.Errorf("keyType mismatch: expected %d, got %d", keyTypeLookedUp, req.KeyType)
	}

	// public key sent from the front-end (no 0x prefix) must match the public key looked up on the mirror node
	publicKey, err := hiero.PublicKeyFromString(req.PublicKey)
	if err != nil {
		return "", fmt.Errorf("failed to parse public key from string: %v", err)
	}
	if publicKeyLookedUp.String() != publicKey.String() || publicKey.String() == "" {
		return "", fmt.Errorf("public key mismatch: expected %s, got %s", publicKeyLookedUp.String(), publicKey.String())
	}

	// Now it's safe to proceed with the publicKey passed from the frontend...
	usdcDecimals, err := strconv.ParseUint(os.Getenv("USDC_DECIMALS"), 10, 64)
	if err != nil {
		return "", fmt.Errorf("failed to parse USDC_DECIMALS: %v", err)
	}

	payloadHex, err := lib.AssemblePayloadHexForSigning(req, usdcDecimals)
	if err != nil {
		return "", fmt.Errorf("failed to extract payload for signing: %v", err)
	}
	// N.B. treat the hex string as a Utf8 string - don't want the hex conversion to remove leading zeros!!!
	payloadUtf8 := payloadHex // Yes, this is intentional
	log.Printf("payloadUtf8: %s", payloadUtf8)

	isValidSig, err := lib.VerifySig(&publicKey, payloadUtf8, req.Sig)
	if err != nil {
		log.Printf("Failed to verify signature: %v", err)
		return "", fmt.Errorf("failed to verify signature: %v", err)
	}
	if !isValidSig {
		log.Printf("Invalid signature for account %s", req.AccountId)
		return "", fmt.Errorf("invalid signature")
	}
	// if we get here, the sig is valid
	log.Printf("**Signature is valid for account %s**", req.AccountId)

	// Now ensure we have an allowance
	_networkSelected, err := hiero.LedgerIDFromString(netSelectedByUser)
	if err != nil {
		return "", fmt.Errorf("failed to get network selected: %v", err)
	}
	_smartContractId, err := hiero.ContractIDFromString(os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(netSelectedByUser))))
	if err != nil {
		return "", fmt.Errorf("failed to validate %s_SMART_CONTRACT_ID: %v", strings.ToUpper(netSelectedByUser), err)
	}
	usdcAddress, err := hiero.ContractIDFromString(os.Getenv(fmt.Sprintf("%s_USDC_ADDRESS", strings.ToUpper(netSelectedByUser))))
	if err != nil {
		return "", fmt.Errorf("failed to validate %s_USDC_ADDRESS: %v", strings.ToUpper(netSelectedByUser), err)
	}

	spenderAllowanceUsd, err := p.hederaService.GetSpenderAllowanceUsd(*_networkSelected, accountId, _smartContractId, usdcAddress, usdcDecimals)
	if err != nil {
		return "", fmt.Errorf("failed to get spender allowance: %v", err)
	}
	log.Printf(("Spender allowance for account %s on contract %s: $%.2f"), accountId.String(), _smartContractId.String(), spenderAllowanceUsd)
	if spenderAllowanceUsd < math.Abs(req.GetPriceUsd()*req.GetQty()) {
		log.Printf("ERROR: Spender allowance ($USD%.2f) too low for this predictionIntent ($USD%.2f)", spenderAllowanceUsd, req.GetPriceUsd()*req.GetQty())
		return "", fmt.Errorf("Spender allowance ($USD%.2f USD token = %s) too low for this predictionIntent ($USD%.2f)", spenderAllowanceUsd, usdcAddress.String(), req.GetPriceUsd()*req.GetQty())
	}

	/// OK - All validations passed
	/// Now you can (attempt to) put the order on the CLOB (subject to on-chain sig verification)

	// store the OrderRequest in the database - the txid must be unique or this fails
	_, err = p.dbRepository.SaveOrderRequest(req)
	if err != nil {
		return "", fmt.Errorf("database error: failed to save order request: %v", err)
	}

	/////
	// notify the CLOB via NATS:
	/////

	// Marshal the CLOB req: *pb_api.PredictionIntentRequest to JSON
	clobRequestObj := &pb_clob.CreateOrderRequestClob{
		TxId:        req.TxId,
		Net:         req.Net,
		MarketId:    req.MarketId,
		AccountId:   req.AccountId,
		MarketLimit: req.MarketLimit,
		PriceUsd:    req.PriceUsd,
		Qty:         req.Qty, // the clob will decrement this value over time as matches occur
		QtyOrig:     req.Qty, // need to keep track of the original qty for on/off-chain signature validation
		Sig:         req.Sig,
		PublicKey:   req.PublicKey, // passing extra key info - i) avoid lookups ii) handle situation where user has changed their key
		EvmAddress:  req.EvmAddress,
		KeyType:     int32(req.KeyType),
	}
	clobRequestJSON, err := json.Marshal(clobRequestObj)
	if err != nil {
		return "", fmt.Errorf("failed to marshal CLOB request: %v", err)
	}

	// Publish the message to NATS:
	err = p.natsService.Publish(lib.SUBJECT_CLOB_ORDERS, clobRequestJSON)
	if err != nil {
		return "", fmt.Errorf("failed to publish to NATS: %v", err)
	}

	log.Printf("Published order to NATS subject '%s': %s", lib.SUBJECT_CLOB_ORDERS, string(clobRequestJSON))

	return fmt.Sprintf("Processed input for user %s", req.AccountId), nil
}

func (p *Prism) MacroMetadata() (*pb_api.MacroMetadataResponse, error) {
	networksEnv := os.Getenv("AVAILABLE_NETWORKS")
	networks := strings.Split(networksEnv, ",")

	smartContractsMap := make(map[string]string)
	for _, net := range networks { // loop through networks and get the smart contract IDs from env vars
		netLower := strings.ToLower(strings.TrimSpace(net))
		envVarName := fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(netLower))
		smartContractId := os.Getenv(envVarName)
		if smartContractId != "" {
			smartContractsMap[netLower] = smartContractId
		}
	}

	usdcAddressesMap := make(map[string]string)
	for _, net := range networks { // loop through networks and get the USDC addresses from env vars
		netLower := strings.ToLower(strings.TrimSpace(net))
		envVarName := fmt.Sprintf("%s_USDC_ADDRESS", strings.ToUpper(netLower))
		usdcAddress := os.Getenv(envVarName)
		if usdcAddress != "" {
			usdcAddressesMap[netLower] = usdcAddress
		}
	}

	marketCreationFeeUsdc := os.Getenv("MARKET_CREATION_FEE_USDC")
	// Validate MARKET_CREATION_FEE_USDC is not empty and is a valid number
	if marketCreationFeeUsdc == "" {
		return nil, fmt.Errorf("MARKET_CREATION_FEE_USDC environment variable is empty")
	}
	marketCreationFeeScaledUsdc, err := strconv.ParseUint(marketCreationFeeUsdc, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("MARKET_CREATION_FEE_USDC environment variable is not a valid float: %v", err)
	}

	response := &pb_api.MacroMetadataResponse{
		AvailableNetworks:           networks,
		SmartContracts:              smartContractsMap,
		UsdcAddresses:               usdcAddressesMap,
		UsdcDecimals:                6,
		MarketCreationFeeScaledUsdc: marketCreationFeeScaledUsdc,
		NMarkets:                    p.marketService.GetNumMarkets(),
	}

	return response, nil
}
