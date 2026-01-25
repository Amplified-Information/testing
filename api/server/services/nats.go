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
	log           *LogService
	nats          *nats.Conn
	hederaService *HederaService
	dbRepository  *repositories.DbRepository
}

func (ns *NatsService) InitNATS(log *LogService, h *HederaService, d *repositories.DbRepository) error {
	ns.log = log

	// connect to NATS
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	natsConn, err := nats.Connect(natsURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %v", err)
	}
	ns.nats = natsConn

	// and inject the HederaService:
	ns.hederaService = h
	// and inject the DbService:
	ns.dbRepository = d

	ns.log.Log(INFO, "Service: NATS service initialized successfully")
	return nil
}

func (ns *NatsService) CloseNATS() error {
	if ns.nats != nil {
		ns.nats.Close()
	}
	return nil
}

func (ns *NatsService) Publish(subject string, data []byte) error {
	if ns.nats == nil {
		return ns.log.Log(ERROR, "NATS connection not initialized")
	}
	if err := ns.nats.Publish(subject, data); err != nil {
		return err
	}
	return nil
}

func (ns *NatsService) Subscribe(subject string, handler nats.MsgHandler) (*nats.Subscription, error) {
	if ns.nats == nil {
		return nil, ns.log.Log(ERROR, "NATS connection not initialized")
	}

	subscription, err := ns.nats.Subscribe(subject, handler)
	if err != nil {
		return nil, ns.log.Log(ERROR, fmt.Sprintf("failed to subscribe to subject %s: %v", subject, err))
	}

	return subscription, nil
}

func (ns *NatsService) HandleOrderMatches() error {
	log.Printf("HandleOrderMatches subscription starting...")
	_, err := ns.Subscribe(lib.NATS_CLOB_MATCHES_WILDCARD, func(msg *nats.Msg) {

		ns.log.Log(INFO, fmt.Sprintf("NATS %s: %s\n", msg.Subject, string(msg.Data)))

		// Guards
		var orderRequestClobTuple [2]*pb_clob.CreateOrderRequestClob
		if err := json.Unmarshal(msg.Data, &orderRequestClobTuple); err != nil {
			ns.log.Log(ERROR, fmt.Sprintf("Error parsing order data: %v", err))
			return
		}

		// assert that [0].marketId and [1].marketId are the same
		if orderRequestClobTuple[0].MarketId != orderRequestClobTuple[1].MarketId {
			ns.log.Log(ERROR, fmt.Sprintf("PROBLEM: the marketIds (%s, %s) don't match! (txid=%s).", orderRequestClobTuple[0].MarketId, orderRequestClobTuple[1].MarketId, orderRequestClobTuple[0].TxId))
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
			ns.log.Log(ERROR, fmt.Sprintf("PROBLEM: priceUsd is 0.0 - this is not allowed (txid=%s).", orderRequestClobTuple[0].TxId))
			return
		}

		// assert that the keyType is not 0
		if orderRequestClobTuple[0].KeyType == 0 || orderRequestClobTuple[1].KeyType == 0 {
			ns.log.Log(ERROR, fmt.Sprintf("PROBLEM: keyType is 0 - this is not allowed (txid=%s).", orderRequestClobTuple[0].TxId))
			return
		}

		// TODO - assert that the user's allowance >= the size of the matched order
		// usersCurrentAllowance // query the mirror node for allowance

		// OK

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
			ns.log.Log(ERROR, "NATS: Invalid subject")
			return
		}

		_, err := ns.dbRepository.RecordMatch(
			[2]*pb_clob.CreateOrderRequestClob{orderRequestClobTuple[0], orderRequestClobTuple[1]},
			isPartial,
		)
		if err != nil {
			ns.log.Log(ERROR, fmt.Sprintf("Error recording match in database: %v", err))
		}

		/////
		// smart contract
		// Now submit BOTH matches to the smart contract
		// BuyPositionTokens determines which account recieves the YES and which account receives the NO (price_usd < 0 => NO)
		/////

		isOK, err := ns.hederaService.BuyPositionTokens(orderRequestClobTuple[0], orderRequestClobTuple[1])
		if err != nil {
			ns.log.Log(ERROR, fmt.Sprintf("Error submitting match to smart contract: %v ", err))
		}
		if !isOK {
			ns.log.Log(ERROR, fmt.Sprintf("BuyPositionTokens returned !isOK for txId=%s, txId=%s", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId))
		}
	})
	if err != nil {
		return err
	}
	return nil
}
