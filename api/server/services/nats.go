package services

import (
	"fmt"
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

type NatsService struct {
	nats *nats.Conn
}

func (n *NatsService) InitNATS() error {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	natsConn, err := nats.Connect(natsURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %v", err)
	}
	n.nats = natsConn
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
		fmt.Printf("Received MATCH message: %s\n", string(msg.Data))

		
	})
	if err != nil {
		return err
	}
	return nil
}
