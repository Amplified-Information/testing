package services

import (
	repositories "api/server/repositories"
	"strconv"
)

type PriceService struct {
	dbRepository *repositories.DbRepository
}

func (p *PriceService) InitPriceService(d *repositories.DbRepository) error {
	// inject the DbService:
	p.dbRepository = d

	// TODO - implement

	return nil
}

func (p *PriceService) GetLatestPriceByMarket(marketId string) (float32, error) {
	priceSafeNumeric, err := p.dbRepository.GetLatestPriceByMarket(marketId)
	if err != nil {
		return 0.0, err
	}
	priceFloat, err := strconv.ParseFloat(priceSafeNumeric, 32)
	if err != nil {
		return 0.0, err
	}
	return float32(priceFloat), nil
}
