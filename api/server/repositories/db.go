package repositories

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

type DbRepository struct {
	db *sql.DB
}

func (dbRepository *DbRepository) CloseDb() error {
	var err = dbRepository.db.Close()
	if err != nil {
		return fmt.Errorf("failed to close database: %v", err)
	}
	return nil
}

func (dbRepository *DbRepository) InitDb() error {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_UNAME"), os.Getenv("DB_PWORD"), os.Getenv("DB_NAME"))

	var db, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}
	dbRepository.db = db

	// Verify connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("DB: DbRepository connected successfully")
	return nil
}

func (dbRepository *DbRepository) IsDuplicateTxId(txId uuid.UUID) (bool, error) {
	if dbRepository.db == nil {
		return false, fmt.Errorf("could not connect to database")
	}

	q := sqlc.New(dbRepository.db)
	isDuplicate, err := q.IsDuplicateTxId(context.Background(), txId)
	if err != nil && err != sql.ErrNoRows {
		return false, fmt.Errorf("failed to check duplicate txId: %v", err)
	}
	return isDuplicate == true, nil
}

// SaveOrderRequest saves an order request to the database
func (dbRepository *DbRepository) SaveOrderIntentRequest(req *pb_api.PredictionIntentRequest) (*sqlc.OrderRequest, error) {
	if dbRepository.db == nil {
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

	q := sqlc.New(dbRepository.db)
	newOrderRequest, err := q.CreateOrderRequest(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("CreateOrderRequest failed: %v", err)
	}

	log.Printf("Saved order request to database for account %s", req.AccountId)
	return &newOrderRequest, nil
}

func (dbRepository *DbRepository) CancelOrderIntent(txId string) error {
	if dbRepository.db == nil {
		return fmt.Errorf("database not initialized")
	}

	txUUID, err := uuid.Parse(txId)
	if err != nil {
		return fmt.Errorf("invalid txId uuid: %v", err)
	}

	q := sqlc.New(dbRepository.db)
	err = q.CancelOrderIntent(context.Background(), txUUID)
	if err != nil {
		return fmt.Errorf("CancelOrderIntent failed: %v", err)
	}

	log.Printf("Cancelled order intent in database for txId: %s", txId)
	return nil
}

func (dbRepository *DbRepository) RecordMatch(orderRequestClobTuple [2]*pb_clob.CreateOrderRequestClob, isPartial bool) (*sqlc.Match, error) {
	// Record the match in the database for auditing
	if dbRepository.db == nil {
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

	q := sqlc.New(dbRepository.db)
	match, err := q.CreateMatch(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("failed to record match for txIds %s and %s: %v", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId, err)
	}

	log.Printf("Recorded match on database for txIds: {%s, %s}", orderRequestClobTuple[0].TxId, orderRequestClobTuple[1].TxId)

	return &match, nil
}

func (dbRepository *DbRepository) CreateSettlement(txIdUuid1 string, txIdUuid2 string, txHash string) error {
	if dbRepository.db == nil {
		return fmt.Errorf("database not initialized")
	}

	txId1, err := uuid.Parse(txIdUuid1)
	if err != nil {
		return fmt.Errorf("invalid txId1 uuid: %v", err)
	}

	txId2, err := uuid.Parse(txIdUuid2)
	if err != nil {
		return fmt.Errorf("invalid txId2 uuid: %v", err)
	}

	params := sqlc.CreateSettlementParams{
		TxId1:  txId1,
		TxId2:  txId2,
		TxHash: txHash,
	}

	q := sqlc.New(dbRepository.db)
	err = q.CreateSettlement(context.Background(), params)
	if err != nil {
		return fmt.Errorf("CreateSettlement failed: %v", err)
	}

	return nil
}

func (dbRepository *DbRepository) CreateNewsletterSubscription(email string, ipAddress string, userAgent string) error {
	if dbRepository.db == nil {
		return fmt.Errorf("database not initialized")
	}

	params := sqlc.CreateNewsletterSubscriptionParams{
		Email:     email,
		IpAddress: sql.NullString{String: ipAddress, Valid: ipAddress != ""},
		UserAgent: sql.NullString{String: userAgent, Valid: userAgent != ""},
	}

	q := sqlc.New(dbRepository.db)
	err := q.CreateNewsletterSubscription(context.Background(), params)
	if err != nil {
		return fmt.Errorf("CreateNewsletterSubscription failed: %v", err)
	}

	log.Printf("Created newsletter subscription for email: %s", email)
	return nil
}

func (dbRepository *DbRepository) GetTotalVolumeUsdInTimePeriod(timePeriod string) (float64, error) {
	if dbRepository.db == nil {
		return 0, fmt.Errorf("database not initialized")
	}

	// TODO - implement real total volume calculation
	// q := sqlc.New(dbRepository.db)
	// totalVolume, err := q.GetTotalVolumeUsdInTimePeriod(context.Background(), timePeriod)
	// if err != nil {
	// 	return 0, fmt.Errorf("GetTotalVolumeUsdInTimePeriod failed: %v", err)
	// }

	return 42, nil
}

func (dbRespository *DbRepository) UpsertUserPositions(evmAddress string, marketId string, nYesTokens int64, nNoTokens int64) (*sqlc.Position, error) {
	if dbRespository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(dbRespository.db)

	result, err := q.UpsertPositions(context.Background(), sqlc.UpsertPositionsParams{
		MarketID:   uuid.MustParse(marketId),
		EvmAddress: evmAddress,
		NYes:       nYesTokens,
		NNo:        nNoTokens,
	})
	if err != nil {
		return nil, fmt.Errorf("UpsertUserPositions failed: %v", err)
	}

	log.Printf("Updated user position tokens: %+v", result)
	return &result, nil
}
