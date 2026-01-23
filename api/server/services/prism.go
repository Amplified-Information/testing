package services

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	pb_api "api/gen"
	"api/server/lib"
	repositories "api/server/repositories"
)

type Prism struct {
	dbRepository      *repositories.DbRepository
	marketsRepository *repositories.MarketsRepository

	natsService   *NatsService
	hederaService *HederaService
	marketService *MarketService
}

func (p *Prism) InitPrism(dbRepository *repositories.DbRepository, marketsRepository *repositories.MarketsRepository, natsService *NatsService, hederaService *HederaService, marketService *MarketService) {
	p.dbRepository = dbRepository
	p.marketsRepository = marketsRepository

	p.natsService = natsService
	p.hederaService = hederaService
	p.marketService = marketService

	log.Printf("Service: Prism service initialized successfully, %p", p)
}

func (p *Prism) MacroMetadata() (*pb_api.MacroMetadataResponse, error) {
	networksEnv := os.Getenv("AVAILABLE_NETWORKS")
	networks := strings.Split(networksEnv, ",")

	smartContractIdsMap := make(map[string]string)
	for _, net := range networks { // loop through networks and get the smart contract IDs from env vars
		netLower := strings.ToLower(strings.TrimSpace(net))
		envVarName := fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(netLower))
		smartContractId := os.Getenv(envVarName)
		if smartContractId != "" {
			smartContractIdsMap[netLower] = smartContractId
		}
	}

	usdcTokenIdsMap := make(map[string]string)
	for _, net := range networks { // loop through networks and get the USDC addresses from env vars
		netLower := strings.ToLower(strings.TrimSpace(net))
		envVarName := fmt.Sprintf("%s_USDC_ADDRESS", strings.ToUpper(netLower))
		usdcTokenId := os.Getenv(envVarName)
		if usdcTokenId != "" {
			usdcTokenIdsMap[netLower] = usdcTokenId
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

	tokenIdsMap := make(map[string]string)
	for _, net := range networks { // loop through networks and get the token addresses from env vars
		netLower := strings.ToLower(strings.TrimSpace(net))
		envVarName := fmt.Sprintf("%s_TOKEN", strings.ToUpper(netLower))
		tokenId := os.Getenv(envVarName)
		if tokenId != "" {
			tokenIdsMap[netLower] = tokenId
		}
	}

	minOrderSizeUsdEnv := os.Getenv("MIN_ORDER_SIZE_USD")
	minOrderSizeUsd, err := strconv.ParseFloat(minOrderSizeUsdEnv, 64)
	if err != nil {
		return nil, fmt.Errorf("MIN_ORDER_SIZE_USD environment variable is not a valid float: %v", err)
	}

	totalVolumeUsd := make(map[string]float64)
	resolutionPeriods := []string{"1h", "24h", "7d", "30d"}
	for _, period := range resolutionPeriods {
		period := strings.ToLower(strings.TrimSpace(period))
		volume, err := p.dbRepository.GetTotalVolumeUsdInTimePeriod(period)
		if err != nil {
			return nil, fmt.Errorf("failed to get total volume USD for network %s: %v", period, err)
		}
		totalVolumeUsd[period] = volume
	}

	response := &pb_api.MacroMetadataResponse{
		AvailableNetworks:           networks,
		SmartContractIds:            smartContractIdsMap,
		UsdcTokenIds:                usdcTokenIdsMap,
		UsdcDecimals:                6,
		MarketCreationFeeScaledUsdc: marketCreationFeeScaledUsdc,
		NMarkets:                    p.marketService.GetNumMarkets(),
		TokenIds:                    tokenIdsMap,
		MinOrderSizeUsd:             minOrderSizeUsd,
		TvlUsd:                      1234567.89,     // TODO - implement real TVL calculation
		TotalVolumeUsd:              totalVolumeUsd, // TODO - implement a real total volume
	}

	return response, nil
}

func (p *Prism) TriggerRecreateClob() error {
	log.Printf("TriggerRecreateClob called on Prism instance: %p", p)

	// retrieve all unresolved markets from the database:
	if p.dbRepository == nil {
		return fmt.Errorf("dbRepository is not initialized")
	}
	markets, err := p.marketsRepository.GetAllUnresolvedMarkets()
	if err != nil {
		return fmt.Errorf("failed to get unresolved markets: %v", err)
	}

	// loop through each unresolved market:
	for _, market := range markets {

		// step 1 - create the market on the CLOB:
		log.Printf("Recreating CLOB for market ID: %s", market.MarketID.String())
		err = lib.CreateMarketOnClob(market.MarketID.String())
		if err != nil {
			return fmt.Errorf("failed to create new market (marketId=%s) on CLOB: %w", market.MarketID.String(), err)
		}

		// step 2 - retrieve from db all the orders for restoring to the CLOB
		// TODO

		// step 3 - push all the retrieved orders onto the CLOB:
		// TODO

		// // create the CreateMarketRequest:
		// createMarketRequest := &pb_api.CreateMarketRequest{}
		// createMarketResponse, err := p.marketService.CreateMarket(createMarketRequest)
		// if err != nil {
		// 	log.Printf("Failed to recreate CLOB for market ID %s: %v", market.MarketID.String(), err)
		// 	continue
		// }
		// log.Printf("Successfully recreated CLOB for market ID: %s", market.MarketID.String())
	}

	return nil
}
