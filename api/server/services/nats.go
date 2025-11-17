package services

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"

	pb_clob "api/gen/clob"
	"api/server/lib"

	"github.com/nats-io/nats.go"
)

type NatsService struct {
	nats          *nats.Conn
	hederaService *HederaService
	dbService     *DbService
}

func (n *NatsService) InitNATS(h *HederaService, d *DbService) error {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	natsConn, err := nats.Connect(natsURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %v", err)
	}
	n.nats = natsConn

	// and inject the HederaService:
	n.hederaService = h
	// and inject the DbService:
	n.dbService = d

	log.Println("NATS initialized successfully")
	return nil
}

func (n *NatsService) CloseNATS() error {
	if n.nats != nil {
		n.nats.Close()
	}
	return nil
}

func (n *NatsService) Publish(subject string, data []byte) error {
	if n.nats == nil {
		return fmt.Errorf("NATS connection not initialized")
	}
	if err := n.nats.Publish(subject, data); err != nil {
		return err
	}
	return nil
}

func (n *NatsService) Subscribe(subject string, handler nats.MsgHandler) (*nats.Subscription, error) {
	if n.nats == nil {
		return nil, fmt.Errorf("NATS connection not initialized")
	}
	subscription, err := n.nats.Subscribe(subject, handler)
	if err != nil {
		return nil, fmt.Errorf("failed to subscribe to subject %s: %v", subject, err)
	}
	return subscription, nil
}

func (n *NatsService) HandleOrderMatches() error {
	log.Printf("NATS_CLOB_MATCHES> subscription starting...")
	_, err := n.Subscribe("clob.matches.*" /* wildcard! */, func(msg *nats.Msg) {
		fmt.Printf("NATS %s: %s\n", msg.Subject, string(msg.Data))

		var orderRequestClobTuple [2]pb_clob.OrderRequestClob
		if err := json.Unmarshal(msg.Data, &orderRequestClobTuple); err != nil {
			log.Printf("Error parsing order data: %v", err)
			return
		}

		/////
		// db
		// Record the match on a database (auditing)
		/////
		isPartial := false
		if msg.Subject == lib.NATS_CLOB_MATCHES_PARTIAL {
			isPartial = true
		} else if msg.Subject == lib.NATS_CLOB_MATCHES_FULL {
			isPartial = false
		}

		_, err := n.dbService.RecordMatch(
			[2]*pb_clob.OrderRequestClob{&orderRequestClobTuple[0], &orderRequestClobTuple[1]},
			isPartial,
		)
		if err != nil {
			log.Printf("Error recording match in database: %v", err)
		}

		/////
		// smart contract
		// Now submit BOTH matches to the smart contract // TODO - atomic txs?
		// Determine which account recieves the YES and which account receives the NO (price_usd < 0 => NO)
		// Determine collateral USD (the lesser of the two sides - e.g. partial match)
		// Example: [{"tx_id":"019a824d-75b4-73af-a19a-11bd6d11afd0","net":"testnet","market_id":"019a7e77-39e2-72a3-9bea-a63bdfa79d20","account_id":"0.0.7090546","market_limit":"limit","price_usd":-0.5,"qty":0.42},{"tx_id":"019a7f37-1f9c-7713-9766-94236e48f261","net":"testnet","market_id":"019a7e77-39e2-72a3-9bea-a63bdfa79d20","account_id":"0.0.7090546","market_limit":"limit","price_usd":0.5,"qty":1.8798}]
		accountIdYes := orderRequestClobTuple[0].AccountId
		accountIdNo := orderRequestClobTuple[1].AccountId
		collateralUsdFloat64 := 0.0
		nPosTokensFloat64 := 0.0
		if orderRequestClobTuple[0].Qty > orderRequestClobTuple[1].Qty {
			nPosTokensFloat64 = orderRequestClobTuple[1].Qty // the lesser of the two amounts
			collateralUsdFloat64 = orderRequestClobTuple[1].Qty * orderRequestClobTuple[1].PriceUsd
			if collateralUsdFloat64 > 0 {
				accountIdYes = orderRequestClobTuple[1].AccountId
				accountIdNo = orderRequestClobTuple[0].AccountId
			}
		} else { // [1].Qty > [0].Qty
			nPosTokensFloat64 = orderRequestClobTuple[0].Qty // the lesser of the two amounts
			collateralUsdFloat64 = orderRequestClobTuple[0].Qty * orderRequestClobTuple[0].PriceUsd
			if collateralUsdFloat64 < 0 {
				accountIdYes = orderRequestClobTuple[1].AccountId
				accountIdNo = orderRequestClobTuple[0].AccountId
			}
		}

		collateralUsdFloat64Abs := math.Abs(collateralUsdFloat64)

		err = n.hederaService.BuyPositionTokens(accountIdYes, accountIdNo, collateralUsdFloat64Abs, nPosTokensFloat64)
		if err != nil {
			log.Printf("Error submitting match to smart contract: %v ", err)
		}
		// // match 1:
		// err = n.hederaService.BuyPositionTokens(&orderRequestClobTuple[0])
		// if err != nil {
		// 	log.Printf("Error submitting match (txid=%s) to smart contract: %v ", orderRequestClobTuple[0].TxId, err)
		// }

		// // match 2:
		// err = n.hederaService.BuyPositionTokens(&orderRequestClobTuple[1])
		// if err != nil {
		// 	log.Printf("Error submitting match (txid=%s) to smart contract: %v ", orderRequestClobTuple[1].TxId, err)
		// }
	})
	if err != nil {
		return err
	}
	return nil
}
