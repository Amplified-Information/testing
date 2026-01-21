package services

import (
	pb_api "api/gen"
	repositories "api/server/repositories"
	"fmt"
)

type PositionsService struct {
	dbRepository *repositories.DbRepository
	priceService *PriceService
}

func (p *PositionsService) Init(d *repositories.DbRepository, ps *PriceService) error {
	// and inject the deps:
	p.dbRepository = d
	p.priceService = ps

	return nil
}

func (p *PositionsService) GetUserPortfolio(req *pb_api.UserPortfolioRequest) (*pb_api.UserPortfolioResponse, error) {
	if req.MarketId == nil {
		// get all markets the user has positions in
		result, err := p.dbRepository.GetUserPortfolio(req.EvmAddress)
		if err != nil {
			return nil, fmt.Errorf("failed to get user portfolio: %w", err)
		}
		response := &pb_api.UserPortfolioResponse{
			Positions: make(map[string]*pb_api.Position),
		}
		for _, row := range result {
			priceUsd, err := p.priceService.GetLatestPriceByMarket(row.MarketID.String())
			if err != nil {
				return nil, fmt.Errorf("failed to get latest price for market %s: %w", row.MarketID.String(), err)
			}

			market, err := p.dbRepository.GetMarketById(row.MarketID.String())
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
	} else {
		// get the user's position for the specific market
		result, err := p.dbRepository.GetUserPortfolioByMarketId(req.EvmAddress, *req.MarketId)
		if err != nil {
			return nil, fmt.Errorf("failed to get user portfolio: %w", err)
		}
		response := &pb_api.UserPortfolioResponse{
			Positions: make(map[string]*pb_api.Position),
		}
		for _, row := range result {
			priceUsd, err := p.priceService.GetLatestPriceByMarket(row.MarketID.String())
			if err != nil {
				return nil, fmt.Errorf("failed to get latest price for market %s: %w", row.MarketID.String(), err)
			}

			market, err := p.dbRepository.GetMarketById(row.MarketID.String())
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
	}

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
