package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	pb_api "api/gen"
	pb_clob "api/gen/clob"
	sqlc "api/gen/sqlc"

	"time"

	"github.com/google/uuid"
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

func (dbService *DbService) IsDuplicateTxId(txId uuid.UUID) (bool, error) {
	if dbService.db == nil {
		return false, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(dbService.db)
	isDuplicate, err := q.IsDuplicateTxId(context.Background(), txId)
	if err != nil && err != sql.ErrNoRows {
		return false, fmt.Errorf("failed to check duplicate txId: %v", err)
	}
	return isDuplicate == true, nil
}

// SaveOrderRequest saves an order request to the database
func (dbService *DbService) SaveOrderRequest(req *pb_api.PredictionIntentRequest) (*sqlc.OrderRequest, error) {
	if dbService.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	txUUID, err := uuid.Parse(req.TxId)
	if err != nil {
		return nil, fmt.Errorf("invalid txId uuid: %v", err)
	}

	marketUUID, err := uuid.Parse(req.MarketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	generatedAt, err := time.Parse(time.RFC3339, req.GeneratedAt) // Zulu time (RFC3339)
	if err != nil {
		return nil, fmt.Errorf("invalid GeneratedAt timestamp: %v", err)
	}
	generatedAt = generatedAt.UTC()

	params := sqlc.CreateOrderRequestParams{
		TxID:        txUUID,
		Net:         req.Net,
		MarketID:    marketUUID,
		AccountID:   req.AccountId,
		MarketLimit: req.MarketLimit,
		PriceUsd:    req.PriceUsd,
		Qty:         req.Qty,
		Sig:         req.Sig,
		GeneratedAt: generatedAt,
	}

	q := sqlc.New(dbService.db)
	newOrderRequest, err := q.CreateOrderRequest(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("CreateOrderRequest failed: %v", err)
	}

	log.Printf("Saved order request to database for account %s", req.AccountId)
	return &newOrderRequest, nil
}

func (dbService *DbService) RecordMatch(orderRequestClobTuple [2]*pb_clob.OrderRequestClob, isPartial bool) (*sqlc.Match, error) {
	// Record the match in the database for auditing
	if dbService.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	txId1, err := uuid.Parse(orderRequestClobTuple[0].TxId)
	if err != nil {
		return nil, fmt.Errorf("invalid txId1 uuid: %v", err)
	}

	txId2, err := uuid.Parse(orderRequestClobTuple[1].TxId)
	if err != nil {
		return nil, fmt.Errorf("invalid txId2 uuid: %v", err)
	}

	params := sqlc.CreateMatchParams{
		TxId1:     txId1,
		TxId2:     txId2,
		IsPartial: isPartial,
	}

	q := sqlc.New(dbService.db)
	match, err := q.CreateMatch(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("failed to record match for txIds %s and %s: %v", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId, err)
	}

	log.Printf("Recorded match on database for txIds: {%s, %s}", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId)

	return &match, nil
}
