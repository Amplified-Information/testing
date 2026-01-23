package services

import (
	repositories "api/server/repositories"
	"log"
	"strconv"
)

type PriceService struct {
	priceRepository *repositories.PriceRepository
}

func (ps *PriceService) InitPriceService(d *repositories.PriceRepository) error {
	// inject the DbService:
	ps.priceRepository = d

	log.Printf("Service: Price service initialized successfully")
	return nil
}

func (ps *PriceService) GetLatestPriceByMarket(marketId string) (float32, error) {
	priceSafeNumeric, err := ps.priceRepository.GetLatestPriceByMarket(marketId)
	if err != nil {
		return 0.0, err
	}
	priceFloat, err := strconv.ParseFloat(priceSafeNumeric, 32)
	if err != nil {
		return 0.0, err
	}
	return float32(priceFloat), nil
}
