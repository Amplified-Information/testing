package main

import (
	// Import the lib package
	"api/server/services"
	"context"
	"fmt"
	"log"
	"net"
	"os"

	pb_api "api/gen"
	repositories "api/server/repositories"

	"google.golang.org/grpc"
)

type server struct {
	pb_api.UnimplementedApiServiceInternalServer
	pb_api.UnimplementedApiServicePublicServer

	dbRepository repositories.DbRepository

	prismService      services.Prism
	natsService       services.NatsService
	marketsService    services.MarketService
	commentsService   services.CommentsService
	newsletterService services.NewsletterService
	positionsService  services.PositionsService
	// don't forget to register in RegisterApiServiceServer grpc call in main()
}

func (s *server) Health(ctx context.Context, req *pb_api.Empty) (*pb_api.StdResponse, error) {
	return &pb_api.StdResponse{
		Message: "OK",
	}, nil
}

func (s *server) PredictIntent(ctx context.Context, req *pb_api.PredictionIntentRequest) (*pb_api.StdResponse, error) {
	if err := req.ValidateAll(); err != nil { // PGV validation
		return &pb_api.StdResponse{Message: fmt.Sprintf("Invalid request: %v", err)}, err
	}

	response, err := s.prismService.SubmitPredictionIntent(req)

	return &pb_api.StdResponse{
		Message: response,
	}, err
}

func (s *server) GetMarketById(ctx context.Context, req *pb_api.MarketIdRequest) (*pb_api.MarketResponse, error) {
	result, err := s.marketsService.GetMarketById(req.GetMarketId())
	return result, err
}

func (s *server) GetMarkets(ctx context.Context, req *pb_api.LimitOffsetRequest) (*pb_api.MarketsResponse, error) {
	result, err := s.marketsService.GetMarkets(req.GetLimit(), req.GetOffset())
	return result, err
}

func (s *server) CreateMarket(ctx context.Context, req *pb_api.CreateMarketRequest) (*pb_api.CreateMarketResponse, error) {
	result, err := s.marketsService.CreateMarket(req)
	return result, err
}

func (s *server) PriceHistory(ctx context.Context, req *pb_api.PriceHistoryRequest) (*pb_api.PriceHistoryResponse, error) {
	result, err := s.marketsService.PriceHistory(req)
	return result, err
}

func (s *server) MacroMetadata(ctx context.Context, req *pb_api.Empty) (*pb_api.MacroMetadataResponse, error) {
	result, err := s.prismService.MacroMetadata()
	return result, err
}

func (s *server) GetComments(ctx context.Context, req *pb_api.GetCommentsRequest) (*pb_api.GetCommentsResponse, error) {
	comments, err := s.commentsService.GetComments(req)
	return comments, err
}

func (s *server) CreateComment(ctx context.Context, req *pb_api.CreateCommentRequest) (*pb_api.CreateCommentResponse, error) {
	commentResp, err := s.commentsService.CreateComment(req)
	return commentResp, err
}

func (s *server) NewsLetter(ctx context.Context, req *pb_api.NewsLetterRequest) (*pb_api.StdResponse, error) {
	newsletterResp, err := s.newsletterService.SubscribeNewsletter(ctx, req)
	return newsletterResp, err
}

func (s *server) UserPosition(ctx context.Context, req *pb_api.UserPositionRequest) (*pb_api.UserPositionResponse, error) {
	positionResp, err := s.positionsService.GetUserPosition(req)
	return positionResp, err
}

func (s *server) TriggerRecreateClob(ctx context.Context, req *pb_api.Empty) (*pb_api.StdResponse, error) {
	err := s.prismService.TriggerRecreateClob()

	var errorCode int32 = 0
	if err != nil {
		errorCode = 1
	}

	return &pb_api.StdResponse{
		Message:   "Triggered recreate CLOB",
		ErrorCode: errorCode,
	}, err
}

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{
		// keep in sync with main.go, docker-compose-monolith.yml, .config and .secrets and the run command in Dockerfile
		"API_SELF_HOST",
		"API_SELF_PORT",
		"CLOB_HOST",
		"CLOB_PORT",
		"USDC_DECIMALS",
		"PREVIEWNET_USDC_ADDRESS",
		"TESTNET_USDC_ADDRESS",
		"MAINNET_USDC_ADDRESS",
		"AVAILABLE_NETWORKS",
		"PREVIEWNET_SMART_CONTRACT_ID",
		"PREVIEWNET_HEDERA_OPERATOR_ID",
		"PREVIEWNET_HEDERA_OPERATOR_KEY_TYPE",
		"PREVIEWNET_PUBLIC_KEY",
		"TESTNET_SMART_CONTRACT_ID",
		"TESTNET_HEDERA_OPERATOR_ID",
		"TESTNET_HEDERA_OPERATOR_KEY_TYPE",
		"TESTNET_PUBLIC_KEY",
		"MAINNET_SMART_CONTRACT_ID",
		"MAINNET_HEDERA_OPERATOR_ID",
		"MAINNET_HEDERA_OPERATOR_KEY_TYPE",
		"MAINNET_PUBLIC_KEY",
		"DB_HOST",
		"DB_PORT",
		"DB_UNAME",
		"DB_NAME",
		"DB_MAX_ROWS",
		"NATS_URL",
		"TIMESTAMP_ALLOWED_PAST_SECONDS",
		"TIMESTAMP_ALLOWED_FUTURE_SECONDS",
		"SEND_EMAIL",
		"EMAIL_ADDRESS",
		"SMTP_ENDPOINT",
		"IAM_USERNAME",
		"SMTP_USERNAME",
		"MARKET_CREATION_FEE_USDC",
		"PREVIEWNET_TOKEN",
		"TESTNET_TOKEN",
		"MAINNET_TOKEN",
		"MIN_ORDER_SIZE_USD",
		// secrets:
		"DB_PWORD",
		"PREVIEWNET_HEDERA_OPERATOR_KEY",
		"TESTNET_HEDERA_OPERATOR_KEY",
		"MAINNET_HEDERA_OPERATOR_KEY",
		"SMTP_PWORD",
	}
	vals := make(map[string]string)

	var missing []string
	for _, name := range vars {
		if val := os.Getenv(name); val == "" {
			missing = append(missing, name)
		} else {
			vals[name] = val
		}
	}

	if len(missing) > 0 {
		log.Fatalf("missing required database environment variables: %v", missing)
	}

	var err error

	/////
	// data layer
	/////
	// initialize database
	dbRepository := repositories.DbRepository{}
	err = dbRepository.InitDb()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbRepository.CloseDb()

	/////
	// service layer
	/////
	// initialize Hedera service
	hederaService := services.HederaService{}
	err = hederaService.InitHedera(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Hedera service: %v", err)
	}
	// TODO: defer hederaService cleanup

	// initialize Markets service
	marketsService := services.MarketService{}
	err = marketsService.Init(&dbRepository, &hederaService)
	if err != nil {
		log.Fatalf("Failed to initialize Markets service: %v", err)
	}

	// initialize Comments service
	commentsService := services.CommentsService{}
	err = commentsService.Init(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Comments service: %v", err)
	}

	// initialize Newsletter service
	newsletterService := services.NewsletterService{}
	err = newsletterService.Init(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Newsletter service: %v", err)
	}

	// initialize Positions service
	positionsService := services.PositionsService{}
	err = positionsService.Init()
	if err != nil {
		log.Fatalf("Failed to initialize Positions service: %v", err)
	}

	// initialize NATS
	natsService := services.NatsService{}
	err = natsService.InitNATS(&hederaService, &dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer natsService.CloseNATS()
	// NATS start listening for matches
	natsService.HandleOrderMatches()

	// initialize prism service
	prismService := services.Prism{}
	prismService.InitPrism(&dbRepository, &natsService, &hederaService, &marketsService)
	// TODO: defer prismService cleanup

	// initialize price service
	priceService := services.PriceService{}
	err = priceService.InitPriceService(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Price service: %v", err)
	}

	// Now start gRPC service
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", os.Getenv("API_SELF_HOST"), os.Getenv("API_SELF_PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Smart contract ID (previewnet): %s", os.Getenv("PREVIEWNET_SMART_CONTRACT_ID"))
	log.Printf("Smart contract ID (testnet): %s", os.Getenv("TESTNET_SMART_CONTRACT_ID"))
	log.Printf("Smart contract ID (mainnet): %s", os.Getenv("MAINNET_SMART_CONTRACT_ID"))

	grpcServer := grpc.NewServer()
	sharedServer := &server{
		dbRepository:      dbRepository,
		prismService:      prismService,
		natsService:       natsService,
		marketsService:    marketsService,
		commentsService:   commentsService,
		newsletterService: newsletterService,
		positionsService:  positionsService,
	}
	// must pass the grpc server to bother internal and the public servers!
	pb_api.RegisterApiServiceInternalServer(grpcServer, sharedServer)
	pb_api.RegisterApiServicePublicServer(grpcServer, sharedServer)

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("API_SELF_HOST"), os.Getenv("API_SELF_PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	// TODO: defer grpcService cleanup
}
