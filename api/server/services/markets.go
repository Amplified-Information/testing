package services

import (
	pb_api "api/gen"
	pb_clob "api/gen/clob"
	sqlc "api/gen/sqlc"
	repositories "api/server/repositories"
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type MarketService struct {
	dbRepository  *repositories.DbRepository
	hederaService *HederaService
}

func (m *MarketService) Init(dbRepository *repositories.DbRepository, hederaService *HederaService) error {
	m.dbRepository = dbRepository
	m.hederaService = hederaService

	log.Printf("Market service initialized successfully")
	return nil
}

func (m *MarketService) GetMarketById(marketId string) (*pb_api.MarketResponse, error) {
	market, err := m.dbRepository.GetMarketById(marketId)
	if err != nil {
		return nil, err
	}

	response, err := mapMarketToMarketResponse(market)
	if err != nil {
		return nil, err
	}
	return response, nil
}

func (m *MarketService) GetMarkets(limit int32, offset int32) (*pb_api.MarketsResponse, error) {
	result := os.Getenv("DB_MAX_ROWS")
	DB_MAX_ROWS, err := strconv.Atoi(result)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_MAX_ROWS environment variable: %v", err)
	}
	if limit > int32(DB_MAX_ROWS) {
		log.Printf("Warning: limit %d exceeds DB_MAX_ROWS %d, setting limit to DB_MAX_ROWS\n", limit, DB_MAX_ROWS)
		limit = int32(DB_MAX_ROWS)
	}

	markets, err := m.dbRepository.GetMarkets(limit, offset)
	if err != nil {
		return nil, err
	}

	var marketResponses []*pb_api.MarketResponse
	for _, market := range markets {
		marketResponse, err := mapMarketToMarketResponse(&market)
		if err != nil {
			return nil, err
		}
		marketResponses = append(marketResponses, marketResponse)
	}

	response := &pb_api.MarketsResponse{
		Markets: marketResponses,
	}
	return response, nil
}

func (m *MarketService) CreateMarket(req *pb_api.CreateMarketRequest) (*pb_api.CreateMarketResponse, error) {
	// guards
	// protobuf validation does a great job sofar ;)

	/////
	// OK - 3 steps to create a new market
	/////

	// Step 1:
	// create a market on the **smart contract** - return with error if it fails
	remainingAllowance, err := m.hederaService.CreateNewMarket(req)
	if err != nil {
		return nil, fmt.Errorf("failed to create new market (marketId=%s) on Hedera: %w", req.MarketId, err)
	}

	// Step 2:
	// create market on the **CLOB** (noauth on port 500051 - not thru the proxy)
	// grpcurl -plaintext -import-path ./proto -proto ./proto/clob.proto -d '{"market_id":"0189c0a8-7e80-7e80-8000-000000000001","net":"testnet"}' $SERVER clob.Clob/AddMarket
	//
	clobAddr := os.Getenv("CLOB_HOST") + ":" + os.Getenv("CLOB_PORT")

	conn, err := grpc.NewClient(clobAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to create new market (marketId=%s) - connect to CLOB gRPC server failed: %w", req.MarketId, err)
	}
	defer conn.Close()

	clobClient := pb_clob.NewClobInternalClient(conn)
	_, err = clobClient.CreateMarket(
		context.Background(),
		&pb_clob.CreateMarketRequest{
			MarketId: req.MarketId,
			Net:      req.Net,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create a market (marketId=%s) on the CLOB (%s): %w", req.MarketId, clobAddr, err)
	}

	// Step 3:
	// now record the tx on the **db**
	contractID, err := hiero.ContractIDFromString(
		os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(req.Net))),
	)
	market, err := m.dbRepository.CreateMarket(req, contractID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to create a new market row (marketId=%s) on the db: %w", req.MarketId, err)
	}

	/////
	// Output: map the result to MarketResponse
	/////
	marketResponse, err := mapMarketToMarketResponse(market)
	if err != nil {
		return nil, err
	}
	return &pb_api.CreateMarketResponse{
		MarketResponse:     marketResponse,
		RemainingAllowance: remainingAllowance,
	}, nil
}

func mapMarketToMarketResponse(market *sqlc.Market) (*pb_api.MarketResponse, error) {
	var createdAt string
	var resolvedAt string
	if !market.CreatedAt.Valid {
		return nil, fmt.Errorf("invalid market: createdAt is null")
	}
	if !market.ResolvedAt.Valid {
		resolvedAt = "" // market may not yet be resolved
	}
	createdAt = market.CreatedAt.Time.Format("2006-01-02T15:04:05Z")
	resolvedAt = market.ResolvedAt.Time.Format("2006-01-02T15:04:05Z")

	var imageUrl string
	if market.ImageUrl.Valid {
		imageUrl = market.ImageUrl.String
	} else {
		imageUrl = ""
	}

	marketResponse := &pb_api.MarketResponse{
		MarketId:   market.MarketID.String(),
		Net:        market.Net,
		Statement:  market.Statement,
		IsOpen:     market.IsOpen,
		CreatedAt:  createdAt,
		ResolvedAt: resolvedAt,
		ImageUrl:   imageUrl,
	}
	return marketResponse, nil
}

func (m *MarketService) PriceHistory(req *pb_api.PriceHistoryRequest) (*pb_api.PriceHistoryResponse, error) {
	// guards
	from, err := time.Parse(time.RFC3339, req.From)
	if err != nil {
		return nil, fmt.Errorf("invalid RFC3339 'from' timestamp: %w", err)
	}
	to, err := time.Parse(time.RFC3339, req.To)
	if err != nil {
		return nil, fmt.Errorf("invalid RFC3339 'to' timestamp: %w", err)
	}
	if to.Before(from) {
		return nil, fmt.Errorf("'from' must be before 'to'")
	}

	resolutionDurations := map[string]time.Duration{
		"second": time.Second,
		"minute": time.Minute,
		"hour":   time.Hour,
		"day":    24 * time.Hour,
		"week":   7 * 24 * time.Hour,
	}
	interval, ok := resolutionDurations[req.Resolution]
	if !ok {
		return nil, fmt.Errorf("unsupported resolution: %s", req.Resolution)
	}

	// --- Enforce max duration based on limit ---
	limit := int32(1000) // optional, default is 100
	if req.Limit != nil && *req.Limit > 0 && *req.Limit <= 1000 {
		limit = *req.Limit
	}
	maxDuration := interval * time.Duration(limit)
	if to.Sub(from) > maxDuration {
		return nil, fmt.Errorf("time range too large for resolution %s (max %v)", req.Resolution, maxDuration)
	}

	offset := int32(0) // optional, default is 0
	if req.Offset != nil && *req.Offset >= 0 {
		offset = *req.Offset
	}

	priceHistory, err := m.dbRepository.GetPriceHistory(req.MarketId, from, to, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}

	ticks := make([]float32, len(priceHistory))
	for i, p := range priceHistory {
		priceFloat, _ := strconv.ParseFloat(p, 32) // convert price NUMERIC(18,10) to float32
		ticks[i] = float32(priceFloat)
	}

	response := &pb_api.PriceHistoryResponse{
		Ticks: ticks,
	}
	return response, nil

	// paginatedPriceHistory, err := m.dbRepository.GetAggregatedPriceHistory(req.MarketId, req.Limit, req.Offset, req.Zoom)
	// if err != nil {
	// 	return nil, err
	// }

	// // uniformArr := make([]float32, req.Limit)
	// // for _, ph := range paginatedPriceHistory { // Fill the uniformArr with price data
	// // 	index := int(ph.Ts.Sub(ts1) / duration) // Determine the index in uniformArr based on the timestamp
	// // 	if index >= 0 && index < int(req.Limit) {
	// // 		priceFloat, _ := strconv.ParseFloat(ph.Price, 32) // convert price NUMERIC(18,10) to float32
	// // 		uniformArr[index] = float32(priceFloat)
	// // 	}
	// // }

	// uniformArr := make([]float32, 0, len(paginatedPriceHistory)) // Preallocate capacity for efficiency
	// for _, ph := range paginatedPriceHistory {
	// 	uniformArr = append(uniformArr, float32(ph.AvgPrice))
	// }

	// response := &pb_api.PriceHistoryResponse{
	// 	Ticks: uniformArr,
	// 	From:  ts1.Format("2006-01-02T15:04:05Z"),
	// 	To:    ts2.Format("2006-01-02T15:04:05Z"),
	// }
	// return response, nil
}

func (m *MarketService) GetNumMarkets() uint32 {
	nMarkets, err := m.dbRepository.CountOpenMarkets()
	if err != nil {
		return 0
	}
	return uint32(nMarkets)
}
