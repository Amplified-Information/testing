package services

import (
	pb_api "api/gen"
	sqlc "api/gen/sqlc"
	repositories "api/server/repositories"
)

type PositionsService struct {
	log                         *LogService
	positionsRepository         *repositories.PositionsRepository
	marketsRepository           *repositories.MarketsRepository
	predictionIntentsRepository *repositories.PredictionIntentsRepository
	priceService                *PriceService
}

func (ps *PositionsService) Init(log *LogService, positionsRepository *repositories.PositionsRepository, marketsRepository *repositories.MarketsRepository, predictionIntentsRepository *repositories.PredictionIntentsRepository, priceService *PriceService) error {
	// and inject the deps:
	ps.log = log
	ps.positionsRepository = positionsRepository
	ps.marketsRepository = marketsRepository
	ps.predictionIntentsRepository = predictionIntentsRepository
	ps.priceService = priceService

	ps.log.Log(INFO, "Service: Positions service initialized successfully")
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
		return nil, ps.log.Log(ERROR, "failed to get user portfolio: %v", err)
	}

	response := &pb_api.UserPortfolioResponse{
		Positions:          make(map[string]*pb_api.Positions),
		OrderbookPositions: make(map[string]*pb_api.Positions),
	}

	for _, row := range result {
		priceUsd, err := ps.priceService.GetLatestPriceByMarket(row.MarketID.String())
		if err != nil {
			return nil, ps.log.Log(ERROR, "failed to get latest price for market %s: %v", row.MarketID.String(), err)
		}

		market, err := ps.marketsRepository.GetMarketById(row.MarketID.String())
		if err != nil {
			return nil, ps.log.Log(ERROR, "failed to get market %s: %v", row.MarketID.String(), err)
		}

		position := &pb_api.Position{
			Yes:        uint64(row.NYes),
			No:         uint64(row.NNo),
			PriceUsd:   priceUsd,
			IsPaused:   market.IsPaused,
			ResolvedAt: market.ResolvedAt.Time.String(),
		}
		if _, ok := response.Positions[row.MarketID.String()]; !ok {
			response.Positions[row.MarketID.String()] = &pb_api.Positions{}
		}
		response.Positions[row.MarketID.String()].Positions = append(response.Positions[row.MarketID.String()].Positions, position)
	}

	// now construct the open orderbookPositions by retrieving all open orders from prediction_intents:
	// response.OrderbookPositions = make(map[string]*pb_api.Position) // REMOVE this line, already initialized above as map[string][]*pb_api.Position
	predictionIntents, err := ps.predictionIntentsRepository.GetAllOpenPredictionIntentsByEvmAddress(req.EvmAddress)
	if err != nil {
		return nil, ps.log.Log(ERROR, "failed to get open prediction intents for account with evm address %s: %v", req.EvmAddress, err)
	}
	// loop through each predictionIntents and add to OrderbookPositions
	for _, pi := range predictionIntents {
		priceUsd, err := ps.priceService.GetLatestPriceByMarket(pi.MarketID.String())
		if err != nil {
			return nil, ps.log.Log(ERROR, "failed to get latest price for market %s: %v", pi.MarketID.String(), err)
		}

		market, err := ps.marketsRepository.GetMarketById(pi.MarketID.String())
		if err != nil {
			return nil, ps.log.Log(ERROR, "failed to get market %s: %v", pi.MarketID.String(), err)
		}

		orderbookPosition := &pb_api.Position{
			Yes:        0,
			No:         0,
			PriceUsd:   priceUsd,
			IsPaused:   market.IsPaused,
			ResolvedAt: market.ResolvedAt.Time.String(),
		}
		if _, ok := response.OrderbookPositions[pi.MarketID.String()]; !ok {
			response.OrderbookPositions[pi.MarketID.String()] = &pb_api.Positions{}
		}
		response.OrderbookPositions[pi.MarketID.String()].Positions = append(response.OrderbookPositions[pi.MarketID.String()].Positions, orderbookPosition)
	}

	return response, nil

	// On-chain query equivalent:
	// contractID, err := hiero.ContractIDFromString(
	// be careful - is _SMART_CONTRACT_ID the correct one here?
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
