package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	pb_clob "api/gen/clob"

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

func (n *NatsService) HandleOrderMatches(subject string) error {
	_, err := n.Subscribe(subject, func(msg *nats.Msg) {
		fmt.Printf("Received MATCH on %s: %s\n", subject, string(msg.Data))

		// Add the match to the database (auditing)
		var orderRequestClob pb_clob.OrderRequestClob
		if err := json.Unmarshal(msg.Data, &orderRequestClob); err != nil {
			log.Printf("Error parsing order data: %v", err)
			return
		}
		txID := orderRequestClob.TxId
		n.dbService.UpdateOrderMatchedAt(txID) // TODO - handle partial matching

		// Now submit the match to the smart contract
		err := n.hederaService.BuyPositionTokens(&orderRequestClob)
		if err != nil {
			log.Printf("Error submitting match (txid=%s) to smart contract: %v ", orderRequestClob.TxId, err)
		}
	})
	if err != nil {
		return err
	}
	return nil
}
