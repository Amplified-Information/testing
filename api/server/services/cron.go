package services

import (
	repositories "api/server/repositories"
	"strings"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type CronService struct {
	log                         *LogService
	priceRepository             *repositories.PriceRepository
	marketsRepository           *repositories.MarketsRepository
	predictionIntentsRepository *repositories.PredictionIntentsRepository
	hederaService               *HederaService
}

func (cs *CronService) Init(log *LogService, mr *repositories.MarketsRepository, pir *repositories.PredictionIntentsRepository, hs *HederaService) error {
	// inject deps
	cs.log = log
	cs.marketsRepository = mr
	cs.predictionIntentsRepository = pir
	cs.hederaService = hs

	cs.log.Log(INFO, "Service: Cron service initialized successfully")
	return nil
}

func (cs *CronService) CronJob() {
	cs.log.Log(INFO, "CronService: Running CronJob...")

	cs.KickOutOrderIntentsNotBackedByFunds()

	cs.log.Log(INFO, "CronService: CronJob completed.")
}

func (cs *CronService) KickOutOrderIntentsNotBackedByFunds() {
	rows, err := cs.marketsRepository.GetAllUnresolvedMarkets()
	if err != nil {
		cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to fetch unresolved markets: %v", err)
		return
	}

	for _, market := range rows {
		cs.log.Log(INFO, "KickOutOrderIntentsNotBackedByFunds: verifying all orderIntents for market ID %d", market.MarketID)

		// retrieve all unique users with live positions...

		// get the allowance for each user

		// retrieve all live orderIntents for this market, this user

		// retrieve all live orderIntents
		orderIntentsSorted, err := cs.predictionIntentsRepository.GetLivePredictionIntentsByMarketIdSortedByAccountID(market.MarketID)
		if err != nil {
			cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to fetch live prediction intents for market ID %d: %v", market.MarketID, err)
			continue
		}

		previousAccountID := ""
		for _, orderIntent := range orderIntentsSorted {
			allowance := 0.0
			if orderIntent.AccountID != previousAccountID {
				// fetch allowance for this account
				net, err := hiero.LedgerIDFromString(strings.ToLower(orderIntent.Net))
				if err != nil {
					cs.log.Log(ERROR, "Failed to parse net %s for account ID %s: %v", orderIntent.Net, orderIntent.AccountID, err)
					continue
				}

				accountId, err := hiero.AccountIDFromString(orderIntent.AccountID)
				if err != nil {
					cs.log.Log(ERROR, "Failed to parse account ID %s: %v", orderIntent.AccountID, err)
					continue
				}

				// 	_ = accountId // currently unused but may be needed in future
				// 	allowance, err = cs.hederaService.GetSpenderAllowanceUsd(net, accountId, smartContractID)
				// 	if err != nil {
				// 		cs.log.Log(ERROR, "Failed to fetch allowance for account ID %s: %v", orderIntent.AccountID, err)
				// 		continue
				// 	}
				// 	cs.log.Log(INFO, "Account ID %s has allowance %f", orderIntent.AccountID, allowance)

				// 	if allowance < orderIntent.TotalCostUsd {

				// 	}

				// 	previousAccountID = orderIntent.AccountID
				// }

				// // verify if backed by funds
				// isBacked, err := cs.hederaService.GetSpenderAllowanceUsd(&orderIntent)
				// if err != nil {
				// 	cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to verify funds for prediction intent txId %s: %v", orderIntent.TxID.String(), err)
				// 	continue
				// }
				// if !isBacked {
				// 	// TODO:
				// 	// cancel order on CLOB
				// 	// mark as cancelled in DB
				// 	}
			}
		}
	}
}
