package services

import (
	repositories "api/server/repositories"
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type CronService struct {
	log                         *LogService
	priceRepository             *repositories.PriceRepository
	marketsRepository           *repositories.MarketsRepository
	predictionIntentsRepository *repositories.PredictionIntentsRepository
	hederaService               *HederaService
	predictionIntentsService    *PredictionIntentsService
}

func (cs *CronService) Init(log *LogService, mr *repositories.MarketsRepository, pir *repositories.PredictionIntentsRepository, hs *HederaService, pis *PredictionIntentsService) error {
	// inject deps
	cs.log = log
	cs.marketsRepository = mr
	cs.predictionIntentsRepository = pir
	cs.hederaService = hs
	cs.predictionIntentsService = pis

	cs.log.Log(INFO, "Service: Cron service initialized successfully")
	return nil
}

func (cs *CronService) CronJob() {
	cs.log.Log(INFO, "CronService: Running CronJob...")

	cs.KickOutOrderIntentsNotBackedByFunds()

	cs.log.Log(INFO, "CronService: CronJob completed.")
}

func (cs *CronService) KickOutOrderIntentsNotBackedByFunds() {
	markets, err := cs.marketsRepository.GetAllUnresolvedMarkets()
	if err != nil {
		cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to fetch unresolved markets: %v", err)
		return
	}

	for _, market := range markets {
		cs.log.Log(INFO, "KickOutOrderIntentsNotBackedByFunds: verifying all orderIntents for market ID %s", market.MarketID)

		// retrieve all unique users with live positions...
		accountIds, err := cs.predictionIntentsRepository.GetAllAccountIdsForMarketId(market.MarketID)
		if err != nil {
			cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to fetch account IDs for market ID %s: %v", market.MarketID, err)
			continue
		}

		for _, accountIdStr := range accountIds {
			cs.log.Log(INFO, "KickOutOrderIntentsNotBackedByFunds: verifying orderIntents for account ID %s on market ID %s", accountIdStr, market.MarketID)

			// get the allowance for each user
			net, err := hiero.LedgerIDFromString(strings.ToLower(market.Net))
			if err != nil {
				cs.log.Log(ERROR, "Failed to parse net %s for account ID %s: %v", market.Net, accountIdStr, err)
				continue
			}

			accountId, err := hiero.AccountIDFromString(accountIdStr)
			if err != nil {
				cs.log.Log(ERROR, "Failed to parse account ID %s: %v", accountIdStr, err)
				continue
			}

			smartContractId, err := hiero.ContractIDFromString(market.SmartContractID)
			if err != nil {
				cs.log.Log(ERROR, "Failed to parse smart contract ID %s for market ID %d: %v", market.SmartContractID, market.MarketID, err)
				continue
			}

			usdcAddressStr := os.Getenv(fmt.Sprintf("%s_USDC_ADDRESS", strings.ToUpper(market.Net)))
			usdcDecimalsStr := os.Getenv("USDC_DECIMALS")

			if usdcAddressStr == "" || usdcDecimalsStr == "" {
				cs.log.Log(ERROR, "USDC_ADDRESS or USDC_DECIMALS environment variable is not set")
				continue
			}
			usdcDecimals, err := strconv.ParseUint(usdcDecimalsStr, 10, 64)
			if err != nil {
				cs.log.Log(ERROR, "invalid USDC_DECIMALS: %v", err)
				continue
			}
			usdcAddress, err := hiero.ContractIDFromString(usdcAddressStr)
			if err != nil {
				cs.log.Log(ERROR, "invalid USDC address: %v", err)
				continue
			}

			allowance, err := cs.hederaService.GetSpenderAllowanceUsd(*net, accountId, smartContractId, usdcAddress, usdcDecimals)
			if err != nil {
				cs.log.Log(ERROR, "Failed to fetch allowance for account ID %s: %v", accountIdStr, err)
				continue
			}
			cs.log.Log(INFO, "-> Account ID %s has allowance %f", accountIdStr, allowance)

			usdcBalance, err := cs.hederaService.GetUsdcBalanceUsd(*net, accountId)
			if err != nil {
				cs.log.Log(ERROR, "Failed to fetch USDC balance for account ID %s: %v", accountIdStr, err)
				continue
			}
			cs.log.Log(INFO, "-> Account ID %s has USDC balance %f", accountIdStr, usdcBalance)

			// retrieve all live orderIntents for this market, for this specific accountId
			sumTotalOfAllPredictionIntents := 0.0
			predictionIntentsForAccountId, err := cs.predictionIntentsRepository.GetLivePredictionIntentsByMarketIdAndAccountId(market.MarketID, accountIdStr)
			if err != nil {
				cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to fetch live prediction intents for market ID %s and account ID %s: %v", market.MarketID, accountIdStr, err)
				continue
			}

			for _, pi := range predictionIntentsForAccountId {
				sumTotalOfAllPredictionIntents += (math.Abs(pi.PriceUsd) * pi.Qty)
				if sumTotalOfAllPredictionIntents > usdcBalance {
					// cancel this order intent
					cs.predictionIntentsService.CancelPredictionIntent(pi.TxID.String(), market.MarketID.String())
					err = cs.predictionIntentsRepository.CancelOrderIntent(pi.TxID.String())
					if err != nil {
						cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to cancel order intent txId %s for market ID %s and account ID %s: %v", pi.TxID.String(), market.MarketID, accountIdStr, err)
						continue
					}
					cs.log.Log(WARN, "-> Cancelled order intent txId %s for market ID %s and account ID %s due to insufficient funds (total required: %f, allowance: %f, balance: %f)", pi.TxID.String(), market.MarketID, accountIdStr, sumTotalOfAllPredictionIntents, allowance, usdcBalance)

					// and mark predictionIntent as evicted:
					err = cs.predictionIntentsRepository.MarkEvicted(pi.TxID)
					if err != nil {
						cs.log.Log(ERROR, "KickOutOrderIntentsNotBackedByFunds: Failed to mark as evicted order intent txId %s for market ID %s and account ID %s: %v", pi.TxID.String(), market.MarketID, accountIdStr, err)
						continue
					}
					cs.log.Log(WARN, "-> Marked as evicted order intent txId %s for market ID %s and account ID %s", pi.TxID.String(), market.MarketID, accountIdStr)
				}
			}
		}
	}
}
