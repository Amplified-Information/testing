package services

import (
	pb_api "api/gen"
	sqlc "api/gen/sqlc"
	repositories "api/server/repositories"
	"fmt"
	"log"
)

type PositionsService struct {
	positionsRepository *repositories.PositionsRepository
	marketsRepository   *repositories.MarketsRepository
	priceService        *PriceService
}

func (ps *PositionsService) Init(positionsRepository *repositories.PositionsRepository, marketsRepository *repositories.MarketsRepository, priceService *PriceService) error {
	// and inject the deps:
	ps.positionsRepository = positionsRepository
	ps.marketsRepository = marketsRepository
	ps.priceService = priceService

	log.Printf("Service: Positions service initialized successfully")
	return nil
}

func (ps *PositionsService) GetUserPortfolio(req *pb_api.UserPortfolioRequest) (*pb_api.UserPortfolioResponse, error) {
	// guards

	// OK
	var result []sqlc.GetUserPortfolioRow
	var err error

	if req.MarketId == nil { // optional parameter
		result, err = ps.positionsRepository.GetUserPortfolio(req.EvmAddress)
	} else {
		result, err = ps.positionsRepository.GetUserPortfolioByMarketId(req.EvmAddress, *req.MarketId)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user portfolio: %w", err)
	}

	response := &pb_api.UserPortfolioResponse{
		Positions: make(map[string]*pb_api.Position),
	}

	for _, row := range result {
		priceUsd, err := ps.priceService.GetLatestPriceByMarket(row.MarketID.String())
		if err != nil {
			return nil, fmt.Errorf("failed to get latest price for market %s: %w", row.MarketID.String(), err)
		}

		market, err := ps.marketsRepository.GetMarketById(row.MarketID.String())
		if err != nil {
			return nil, fmt.Errorf("failed to get market %s: %w", row.MarketID.String(), err)
		}

		position := &pb_api.Position{
			Yes:        uint64(row.NYes),
			No:         uint64(row.NNo),
			PriceUsd:   priceUsd,
			IsPaused:   market.IsPaused,
			ResolvedAt: market.ResolvedAt.Time.String(),
		}
		response.Positions[row.MarketID.String()] = position
	}
	return response, nil

	// On-chain query equivalent:
	// contractID, err := hiero.ContractIDFromString(
	// 	os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(req.Net))),
	// )
	// if err != nil {
	// 	return nil, fmt.Errorf("invalid contract ID: %v", err)
	// }
	// params := hiero.NewContractFunctionParameters()
	// params.AddUint128BigInt(marketIdBig)
	// params.AddAddress(req.EvmAddress)

	// query := hiero.NewContractCallQuery().
	// 	SetContractID(contractID).
	// 	SetGas(100_000).
	// 	SetFunction("getUserTokens", params)
	// 	// TODO - remove this print!
	// fmt.Println(query.GetContractID().String())
}
