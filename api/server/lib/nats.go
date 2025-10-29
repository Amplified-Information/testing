package lib

import (
	"fmt"
	"os"

	"github.com/nats-io/nats.go"
)

func GetNATSConnection() (*nats.Conn, error) {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	natsConn, err := nats.Connect(natsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %v", err)
	}
	return natsConn, nil
}
