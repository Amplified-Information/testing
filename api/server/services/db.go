package services

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	pb_api "api/gen"

	_ "github.com/lib/pq"
)

type DbService struct {
	db *sql.DB
}

func (dbService *DbService) CloseDb() error {
	var err = dbService.db.Close()
	if err != nil {
		return fmt.Errorf("failed to close database: %v", err)
	}
	return nil
}

func (dbService *DbService) InitDb() error {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_UNAME"), os.Getenv("DB_PWORD"), os.Getenv("DB_NAME"))

	var db, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}
	dbService.db = db

	// Verify connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

func (dbService *DbService) IsDuplicateTxId(txId string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM order_requests WHERE tx_id = $1)`
	err := dbService.db.QueryRow(query, txId).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check duplicate txId: %v", err)
	}
	return exists, nil
}

// SaveOrderRequest saves an order request to the database
func (dbService *DbService) SaveOrderRequest(req *pb_api.PredictionIntentRequest) error {
	if dbService.db == nil {
		return fmt.Errorf("database not initialized")
	}

	// Using raw SQL queries - no ORM for simplicity and performance
	// TODO: sqlc or sqlx
	insertSQL := `
		INSERT INTO order_requests (tx_id, net, market_id, account_id, market_limit, price_usd, qty, generated_at, sig)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := dbService.db.Exec(insertSQL,
		req.TxId,
		req.Net,
		req.MarketId,
		req.AccountId,
		req.MarketLimit,
		req.PriceUsd,
		req.Qty,
		req.GeneratedAt,
		req.Sig,
	)

	if err != nil {
		return fmt.Errorf("failed to insert order request: %v", err)
	}

	log.Printf("Saved order request to database for account %s", req.AccountId)
	return nil
}

func (dbService *DbService) UpdateOrderMatchedAt(txId string) error {
	if dbService.db == nil {
		return fmt.Errorf("database not initialized!")
	}

	updateSQL := `
		UPDATE order_requests
		SET matched_at = NOW()
		WHERE tx_id = $1`

	_, err := dbService.db.Exec(updateSQL, txId)
	if err != nil {
		return fmt.Errorf("failed to update matched_at for txId %s: %v", txId, err)
	}

	log.Printf("Updated \"matched_at\" timestamp for txId %s", txId)
	return nil
}
