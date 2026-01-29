package repositories

import (
	sqlc "api/gen/sqlc"
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"

	pb_api "api/gen"
)

type PredictionIntentsRepository struct {
	db *sql.DB
}

func (pir *PredictionIntentsRepository) CloseDb() error {
	var err = pir.db.Close()
	if err != nil {
		return fmt.Errorf("failed to close database: %v", err)
	}
	return nil
}

func (pir *PredictionIntentsRepository) InitDb() error {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_UNAME"), os.Getenv("DB_PWORD"), os.Getenv("DB_NAME"))

	var db, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}
	pir.db = db

	// Verify connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("DB: PredictionIntentsRepository connected successfully")
	return nil
}

// SaveOrderRequest saves an order request to the database
func (pir *PredictionIntentsRepository) CreateOrderIntentRequest(req *pb_api.PredictionIntentRequest) (*sqlc.OrderRequest, error) {
	if pir.db == nil {
		return nil, fmt.Errorf("could not connect to database")
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
		TxID:         txUUID,
		Net:          req.Net,
		MarketID:     marketUUID,
		AccountID:    req.AccountId,
		MarketLimit:  req.MarketLimit,
		PriceUsd:     req.PriceUsd,
		Qty:          req.Qty,
		Sig:          req.Sig,
		GeneratedAt:  generatedAt,
		PublicKeyHex: req.PublicKey,
		Evmaddress:   req.EvmAddress,
		Keytype:      int32(req.KeyType),
	}

	q := sqlc.New(pir.db)
	newOrderRequest, err := q.CreateOrderRequest(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("CreateOrderRequest failed: %v", err)
	}

	log.Printf("Saved order request to database for account %s", req.AccountId)
	return &newOrderRequest, nil
}

func (pir *PredictionIntentsRepository) CancelOrderIntent(txId string) error {
	if pir.db == nil {
		return fmt.Errorf("database not initialized")
	}

	txUUID, err := uuid.Parse(txId)
	if err != nil {
		return fmt.Errorf("invalid txId uuid: %v", err)
	}

	q := sqlc.New(pir.db)
	err = q.CancelOrderIntent(context.Background(), txUUID)
	if err != nil {
		return fmt.Errorf("CancelOrderIntent failed: %v", err)
	}

	log.Printf("Cancelled order intent in database for txId: %s", txId)
	return nil
}

func (pir *PredictionIntentsRepository) GetAllPredictionIntentsByMarketId(marketId string) (*[]sqlc.OrderRequest, error) {
	if pir.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	q := sqlc.New(pir.db)
	predictionIntents, err := q.GetAllPredictionIntentsByMarketId(context.Background(), marketUUID)
	if err != nil {
		return nil, fmt.Errorf("GetAllPredictionIntentsByMarketId failed: %v", err)
	}

	// log.Printf("Fetched %d prediction intents from database for market ID: %s", len(predictionIntents), marketId)
	return &predictionIntents, nil
}

func (dbRepository *DbRepository) MarkPredictionIntentAsRegenerated(txId string) error {
	if dbRepository.db == nil {
		return fmt.Errorf("database not initialized")
	}

	q := sqlc.New(dbRepository.db)
	err := q.MarkPredictionIntentAsRegenerated(context.Background(), uuid.MustParse(txId))
	if err != nil {
		return fmt.Errorf("MarkPredictionIntentAsRegenerated failed: %v", err)
	}
	return nil
}

func (pir *PredictionIntentsRepository) MarkOrderRequestAsFullyMatched(marketId string, txId string) error {
	if pir.db == nil {
		return fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return fmt.Errorf("invalid marketId uuid: %v", err)
	}

	txUUID, err := uuid.Parse(txId)
	if err != nil {
		return fmt.Errorf("invalid txId uuid: %v", err)
	}

	q := sqlc.New(pir.db)
	_, err = q.MarkOrderRequestAsFullyMatched(context.Background(), sqlc.MarkOrderRequestAsFullyMatchedParams{
		MarketID: marketUUID,
		TxID:     txUUID,
	})
	if err != nil {
		return fmt.Errorf("MarkOrderRequestAsFullyMatched failed: %v", err)
	}

	log.Printf("Marked order request as fully matched in database for txId: %s", txId)
	return nil
}

func (pir *PredictionIntentsRepository) GetAllAccountIdsForMarketId(marketId uuid.UUID) ([]string, error) {
	if pir.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(pir.db)
	accountIds, err := q.GetAllAccountIdsForMarketId(context.Background(), marketId)
	if err != nil {
		return nil, fmt.Errorf("GetAllAccountIdsForMarketId failed: %v", err)
	}

	return accountIds, nil
}

func (pir *PredictionIntentsRepository) GetLivePredictionIntentsByMarketIdAndAccountId(marketId uuid.UUID, accountId string) ([]sqlc.OrderRequest, error) {
	if pir.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(pir.db)
	orderIntents, err := q.GetLivePredictionIntentsByMarketIdAndAccountId(context.Background(), sqlc.GetLivePredictionIntentsByMarketIdAndAccountIdParams{
		MarketID:  marketId,
		AccountID: accountId,
	})
	if err != nil {
		return nil, fmt.Errorf("GetLivePredictionIntentsByMarketIdAndAccountId failed: %v", err)
	}

	return orderIntents, nil
}

func (pir *PredictionIntentsRepository) MarkEvicted(txId uuid.UUID) error {
	if pir.db == nil {
		return fmt.Errorf("database not initialized")
	}

	q := sqlc.New(pir.db)
	err := q.MarkEvicted(context.Background(), txId)
	if err != nil {
		return fmt.Errorf("MarkEvicted failed: %v", err)
	}
	return nil
}
