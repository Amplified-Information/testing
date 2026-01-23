package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	pb_clob "api/gen/clob"
	"api/server/lib"
	repositories "api/server/repositories"

	"github.com/nats-io/nats.go"
)

type NatsService struct {
	nats          *nats.Conn
	hederaService *HederaService
	dbRepository  *repositories.DbRepository
}

func (n *NatsService) InitNATS(h *HederaService, d *repositories.DbRepository) error {
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
	n.dbRepository = d

	log.Println("Service: NATS service initialized successfully")
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
	log.Printf("HandleOrderMatches subscription starting...")
	_, err := n.Subscribe(lib.NATS_CLOB_MATCHES_WILDCARD, func(msg *nats.Msg) {

		fmt.Printf("NATS %s: %s\n", msg.Subject, string(msg.Data))

		var orderRequestClobTuple [2]*pb_clob.CreateOrderRequestClob
		if err := json.Unmarshal(msg.Data, &orderRequestClobTuple); err != nil {
			log.Printf("Error parsing order data: %v", err)
			return
		}

		// assert that [0].marketId and [1].marketId are the same
		if orderRequestClobTuple[0].MarketId != orderRequestClobTuple[1].MarketId {
			log.Printf("PROBLEM: the marketIds (%s, %s) don't match! (txid=%s).", orderRequestClobTuple[0].MarketId, orderRequestClobTuple[1].MarketId, orderRequestClobTuple[0].TxId)
			return
		}

		/////
		// N.B. ///// this is an invalid assertion because a high bid can be higher than the lowest ask and vice-versa
		/////
		// assert that the two priceUsd's cancel each other out
		// priceDiff := orderRequestClobTuple[0].PriceUsd + orderRequestClobTuple[1].PriceUsd
		// if priceDiff != 0.0 {
		// 	log.Printf("PROBLEM: orderRequestClobTuple[0] + orderRequestClobTuple[1] is %f and not 0.0", priceDiff)
		// 	return
		// }

		// assert that priceUsd is not 0.0
		if orderRequestClobTuple[0].PriceUsd == 0.0 {
			log.Printf("PROBLEM: priceUsd is 0.0 - this is not allowed (txid=%s).", orderRequestClobTuple[0].TxId)
			return
		}

		// assert that the keyType is not 0
		if orderRequestClobTuple[0].KeyType == 0 || orderRequestClobTuple[1].KeyType == 0 {
			log.Printf("PROBLEM: keyType is 0 - this is not allowed (txid=%s).", orderRequestClobTuple[0].TxId)
			return
		}

		/////
		// db
		// Record the match on a database (auditing)
		/////
		isPartial := false
		switch msg.Subject {
		case lib.NATS_CLOB_MATCHES_PARTIAL:
			isPartial = true
		case lib.NATS_CLOB_MATCHES_FULL:
			isPartial = false
		default:
			log.Printf("NATS: Invalid subject")
			return
		}

		_, err := n.dbRepository.RecordMatch(
			[2]*pb_clob.CreateOrderRequestClob{orderRequestClobTuple[0], orderRequestClobTuple[1]},
			isPartial,
		)
		if err != nil {
			log.Printf("Error recording match in database: %v", err)
		}

		/////
		// smart contract
		// Now submit BOTH matches to the smart contract
		// BuyPositionTokens determines which account recieves the YES and which account receives the NO (price_usd < 0 => NO)
		/////

		isOK, err := n.hederaService.BuyPositionTokens(orderRequestClobTuple[0], orderRequestClobTuple[1])
		if err != nil {
			log.Printf("Error submitting match to smart contract: %v ", err)
		}
		if !isOK {
			log.Printf("BuyPositionTokens returned !isOK for txId=%s, txId=%s", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId)
		}
	})
	if err != nil {
		return err
	}
	return nil
}
