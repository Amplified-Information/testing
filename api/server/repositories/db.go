package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	pb_api "api/gen"
	pb_clob "api/gen/clob"
	sqlc "api/gen/sqlc"
	"api/server/lib"

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

	log.Println("Database connected successfully")
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
func (dbRepository *DbRepository) SaveOrderRequest(req *pb_api.PredictionIntentRequest) (*sqlc.OrderRequest, error) {
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

func (dbRepository *DbRepository) GetMarketById(marketId string) (*sqlc.Market, error) {
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	q := sqlc.New(dbRepository.db)
	market, err := q.GetMarket(context.Background(), marketUUID)
	if err != nil {
		return nil, fmt.Errorf("GetMarket failed: %v", err)
	}

	// log.Printf("Fetched market from database: %s", market.MarketID.String())
	return &market, nil
}

func (dbRepository *DbRepository) GetMarkets(limit int32, offset int32) ([]sqlc.Market, error) {
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(dbRepository.db)
	markets, err := q.GetMarkets(context.Background(), sqlc.GetMarketsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("GetMarkets failed: %v", err)
	}

	// log.Printf("Fetched %d markets from database", len(markets))
	return markets, nil
}

func (dbRepository *DbRepository) CreateMarket(marketId string, statement string, net string, smartContractId string) (*sqlc.Market, error) {
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	net = strings.ToLower(net)
	isValid := lib.IsValidNetwork(net)
	if !isValid {
		return nil, fmt.Errorf("invalid network: %s", net)
	}

	isValidSmartContractId := lib.IsValidAccountId(smartContractId)
	if !isValidSmartContractId {
		return nil, fmt.Errorf("invalid smart contract ID: %s", smartContractId)
	}

	// Start a transaction
	tx, err := dbRepository.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}

	// Use the transaction with the query builder
	q := sqlc.New(tx)
	market, err := q.CreateMarket(context.Background(), sqlc.CreateMarketParams{
		MarketID:        marketUUID,
		Net:             net,
		Statement:       statement,
		SmartContractID: smartContractId,
	})
	if err != nil {
		tx.Rollback() // Rollback the transaction on error
		return nil, fmt.Errorf("CreateMarket failed: %v", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	log.Printf("Created new market in database: %s", market.MarketID.String())
	return &market, nil
}

// func (dbRepository *DbRepository) GetPricesByMarketInRange(marketId string, ts1 time.Time, ts2 time.Time) ([]sqlc.GetPricesByMarketInRangeRow, error) {
// 	if dbRepository.db == nil {
// 		return nil, fmt.Errorf("database not initialized")
// 	}

// 	marketUUID, err := uuid.Parse(marketId)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
// 	}

// 	q := sqlc.New(dbRepository.db)
// 	priceHistory, err := q.GetPricesByMarketInRange(context.Background(), sqlc.GetPricesByMarketInRangeParams{
// 		MarketID: marketUUID,
// 		Ts:       ts1,
// 		Ts_2:     ts2,
// 	})
// 	if err != nil {
// 		return nil, fmt.Errorf("GetPricesByMarketSince failed: %v", err)
// 	}

//		return priceHistory, nil
//	}
func (dbRepository *DbRepository) GetPriceHistory(marketId string, from time.Time, to time.Time, limit int32, offset int32) ([]string, error) { // yes, it returns []string due to - price NUMERIC(18,10)
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	q := sqlc.New(dbRepository.db)
	priceHistory, err := q.GetPriceHistorySafer(context.Background(), sqlc.GetPriceHistorySaferParams{
		MarketID: marketUUID,
		Ts:       from,
		Ts_2:     to,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("GetAggregatedPriceHistory failed: %v", err)
	}

	return priceHistory, nil
}

func (dbRepository *DbRepository) SavePriceHistory(marketId string, txId string, price float64) error {
	if dbRepository.db == nil {
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

	params := sqlc.InsertPriceParams{
		MarketID: marketUUID,
		TxID:     txUUID,
		Price:    fmt.Sprintf("%f", price), // use of NUMERIC(18,10) avoids floating point imprecision
		Ts:       time.Now().UTC(),
	}

	q := sqlc.New(dbRepository.db)
	err = q.InsertPrice(context.Background(), params)
	if err != nil {
		return fmt.Errorf("InsertPriceHistory failed: %v", err)
	}

	return nil
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

func (dbRepository *DbRepository) GetCommentsByMarketId(marketId string, limit int32, offset int32) (*pb_api.GetCommentsResponse, error) {
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	q := sqlc.New(dbRepository.db)
	rows, err := q.GetCommentsByMarketId(context.Background(), sqlc.GetCommentsByMarketIdParams{
		MarketID: marketUUID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, fmt.Errorf("GetCommentsByMarketId failed: %v", err)
	}

	var resonseObject pb_api.GetCommentsResponse
	for _, row := range rows {
		commentResponse := &pb_api.Comment{
			AccountId: row.AccountID,
			Content:   row.Content,
			Sig:       row.Sig,
			PublicKey: row.PublicKey,
			KeyType:   uint32(row.KeyType),
			CreatedAt: row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
		resonseObject.Comments = append(resonseObject.Comments, commentResponse)
	}

	return &resonseObject, nil
}

func (dbRepository *DbRepository) CreateComment(marketId string, accountId string, content string, sig string, publicKey string, keyType uint32) (*sqlc.AddCommentRow, error) {
	if dbRepository.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	marketUUID, err := uuid.Parse(marketId)
	if err != nil {
		return nil, fmt.Errorf("invalid marketId uuid: %v", err)
	}

	if !lib.IsValidAccountId(accountId) {
		return nil, fmt.Errorf("invalid accountId: %s", accountId)
	}

	params := sqlc.AddCommentParams{
		MarketID:  marketUUID,
		AccountID: accountId,
		Content:   content,
		Sig:       sig,
		PublicKey: publicKey,
		KeyType:   int32(keyType),
	}

	q := sqlc.New(dbRepository.db)
	row, err := q.AddComment(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("AddComment failed: %v", err)
	}

	log.Printf("Added comment to database for market %s by account %s", marketId, accountId)
	return &row, nil
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

func (dbRepository *DbRepository) CountOpenMarkets() (int64, error) {
	if dbRepository.db == nil {
		return 0, fmt.Errorf("database not initialized")
	}

	q := sqlc.New(dbRepository.db)
	count, err := q.CountOpenMarkets(context.Background())
	if err != nil {
		return 0, fmt.Errorf("CountOpenMarkets failed: %v", err)
	}

	return count, nil
}
