package services

import repositories "api/server/repositories"

type PriceService struct {
	dbRepository *repositories.DbRepository
}

func (p *PriceService) InitPriceService(d *repositories.DbRepository) error {
	// inject the DbService:
	p.dbRepository = d

	// TODO - implement

	return nil
}
