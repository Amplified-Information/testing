package services

import (
	pb_api "api/gen"
	sqlc "api/gen/sqlc"
	repositories "api/server/repositories"
	"fmt"
	"log"
	"os"
	"strconv"
)

type MarketService struct {
	dbRepository *repositories.DbRepository
}

func (m *MarketService) Init(dbRepository *repositories.DbRepository) error {
	m.dbRepository = dbRepository

	log.Printf("MarketService initialized successfully")
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

func (m *MarketService) CreateMarket(req *pb_api.NewMarketRequest) (*pb_api.MarketResponse, error) {
	market, err := m.dbRepository.CreateMarket(req.MarketId, req.Statement)
	if err != nil {
		return nil, err
	}

	response, err := mapMarketToMarketResponse(market)
	if err != nil {
		return nil, err
	}
	return response, nil
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

	marketResponse := &pb_api.MarketResponse{
		MarketId:   market.MarketID.String(),
		Statement:  market.Statement,
		IsOpen:     market.IsOpen,
		CreatedAt:  createdAt,
		ResolvedAt: resolvedAt,
	}
	return marketResponse, nil
}
