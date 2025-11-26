package services

import (
	"encoding/json"
	"fmt"
	"log"
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
	log.Printf("HandleOrderMatches subscription starting...")
	_, err := n.Subscribe(lib.NATS_CLOB_MATCHES_WILDCARD, func(msg *nats.Msg) {
		fmt.Printf("NATS %s: %s\n", msg.Subject, string(msg.Data))

		var orderRequestClobTuple [2]pb_clob.OrderRequestClob
		if err := json.Unmarshal(msg.Data, &orderRequestClobTuple); err != nil {
			log.Printf("Error parsing order data: %v", err)
			return
		}

		// assert that [0].marketId and [1].marketId are the same
		if orderRequestClobTuple[0].MarketId != orderRequestClobTuple[1].MarketId {
			log.Printf("PROBLEM: the marketIds (%s, %s) don't match! (txid=%s).", orderRequestClobTuple[0].MarketId, orderRequestClobTuple[1].MarketId, orderRequestClobTuple[0].TxId)
			return
		}

		// assert that the two priceUsd's cancel each other out
		priceDiff := orderRequestClobTuple[0].PriceUsd + orderRequestClobTuple[1].PriceUsd
		if priceDiff != 0.0 {
			log.Printf("PROBLEM: orderRequestClobTuple[0] + orderRequestClobTuple[1] is %f and not 0.0", priceDiff)
			return
		}

		// assert that priceUsd is not 0.0
		if orderRequestClobTuple[0].PriceUsd == 0.0 {
			log.Printf("PROBLEM: priceUsd is 0.0 - this is not allowed (txid=%s).", orderRequestClobTuple[0].TxId)
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
		origPricelUsdYes := orderRequestClobTuple[0].PriceUsd
		origPricelUsdNo := orderRequestClobTuple[1].PriceUsd
		accountIdYes := orderRequestClobTuple[0].AccountId
		accountIdNo := orderRequestClobTuple[1].AccountId
		txIdUuidYes := orderRequestClobTuple[0].TxId
		txIdUuidNo := orderRequestClobTuple[1].TxId
		sigYes_base64 := orderRequestClobTuple[0].Sig
		sigNo_base64 := orderRequestClobTuple[1].Sig

		// collateralUsdFloat := qty * orderRequestClobTuple[0].PriceUsd // [0] and [1] priceUsd have the same abs value
		// collateralUsdFloatAbs := math.Abs(collateralUsdFloat)

		// collateralUsdFloat64 := 0.0
		// if orderRequestClobTuple[0].Qty > orderRequestClobTuple[1].Qty { // [1] is fully matched, [0] is partially matched
		// 	// this amount ([1] is the lower Qty) of USDC will be taken as collateral
		// 	collateralUsdFloat64 = orderRequestClobTuple[1].Qty * orderRequestClobTuple[1].PriceUsd
		// } else { // [1].Qty > [0].Qty ......... [0] is fully matched, [1] is partially matched
		// 	// this amount ([0] is the lower Qty) of USDC will be taken as collateral
		// 	collateralUsdFloat64 = orderRequestClobTuple[0].Qty * orderRequestClobTuple[0].PriceUsd
		// }

		// do we need to flip which accoundId is YES and which accountId is NO?
		// by default:
		//   -> [0] is YES, [1] is NO
		// iff [0].PriceUsd < 0.0
		//   -> [0] is NO, [1] is YES
		if orderRequestClobTuple[0].PriceUsd < 0 {
			origPricelUsdYes, origPricelUsdNo = origPricelUsdNo, origPricelUsdYes
			accountIdYes, accountIdNo = accountIdNo, accountIdYes
			txIdUuidYes, txIdUuidNo = txIdUuidNo, txIdUuidYes
			sigYes_base64, sigNo_base64 = sigNo_base64, sigYes_base64
		}

		isOK, err := n.hederaService.BuyPositionTokens(
			orderRequestClobTuple[0].MarketId,                               // marketId[1] and marketId[0] are the same
			min(orderRequestClobTuple[0].Qty, orderRequestClobTuple[1].Qty), // take the *lower* Qty
			origPricelUsdYes,
			origPricelUsdNo,
			accountIdYes,
			accountIdNo,
			txIdUuidYes,
			txIdUuidNo,
			sigYes_base64,
			sigNo_base64,
		)
		if err != nil {
			log.Printf("Error submitting match to smart contract: %v ", err)
		}
		if !isOK {
			log.Printf("Smart contract did not accept the parameters")
		}
	})
	if err != nil {
		return err
	}
	return nil
}
