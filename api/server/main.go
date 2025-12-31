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
	pb_api.UnimplementedApiServiceServer
	dbRepository repositories.DbRepository

	prismService    services.Prism
	natsService     services.NatsService
	marketsService  services.MarketService
	commentsService services.CommentsService
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

func (s *server) CreateMarket(ctx context.Context, req *pb_api.NewMarketRequest) (*pb_api.MarketResponse, error) {
	result, err := s.marketsService.CreateMarket(req)
	return result, err
}

func (s *server) PriceHistory(ctx context.Context, req *pb_api.PriceHistoryRequest) (*pb_api.PriceHistoryResponse, error) {
	result, err := s.marketsService.PriceHistory(req)
	return result, err
}

func (s *server) AvailableNetworks(ctx context.Context, req *pb_api.Empty) (*pb_api.StdResponse, error) {
	result, err := s.prismService.AvailableNetworks()
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

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{
		"AVAILABLE_NETWORKS",
		"API_HOST",
		"API_PORT",
		"USDC_DECIMALS",
		"PREVIEWNET_USDC_ADDRESS",
		"TESTNET_USDC_ADDRESS",
		"MAINNET_USDC_ADDRESS",
		"PREVIEWNET_SMART_CONTRACT_ID",
		"TESTNET_SMART_CONTRACT_ID",
		"MAINNET_SMART_CONTRACT_ID",
		"PREVIEWNET_HEDERA_OPERATOR_ID",
		"PREVIEWNET_HEDERA_OPERATOR_KEY_TYPE",
		"PREVIEWNET_PUBLIC_KEY",
		"TESTNET_HEDERA_OPERATOR_ID",
		"TESTNET_HEDERA_OPERATOR_KEY_TYPE",
		"TESTNET_PUBLIC_KEY",
		"MAINNET_HEDERA_OPERATOR_ID",
		"MAINNET_HEDERA_OPERATOR_KEY_TYPE",
		"MAINNET_PUBLIC_KEY",
		"NATS_URL",
		"DB_HOST",
		"DB_PORT",
		"DB_UNAME",
		"DB_PWORD",
		"DB_NAME",
		"DB_MAX_ROWS",
		"TIMESTAMP_ALLOWED_FUTURE_SECONDS",
		"TIMESTAMP_ALLOWED_PAST_SECONDS",
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
	err = marketsService.Init(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Markets service: %v", err)
	}

	// initialize Comments service
	commentsService := services.CommentsService{}
	err = commentsService.Init(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Comments service: %v", err)
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
	prismService.InitPrism(&dbRepository, &natsService, &hederaService)
	// TODO: defer prismService cleanup

	// initialize price service
	priceService := services.PriceService{}
	err = priceService.InitPriceService(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Price service: %v", err)
	}

	// Now start gRPC service
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", os.Getenv("API_HOST"), os.Getenv("API_PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Smart contract ID (previewnet): %s", os.Getenv("PREVIEWNET_SMART_CONTRACT_ID"))
	log.Printf("Smart contract ID (testnet): %s", os.Getenv("TESTNET_SMART_CONTRACT_ID"))
	log.Printf("Smart contract ID (mainnet): %s", os.Getenv("MAINNET_SMART_CONTRACT_ID"))

	grpcServer := grpc.NewServer()
	pb_api.RegisterApiServiceServer(grpcServer, &server{
		dbRepository: dbRepository,

		prismService:    prismService,
		natsService:     natsService,
		marketsService:  marketsService,
		commentsService: commentsService,
	})

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("API_HOST"), os.Getenv("API_PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	// TODO: defer grpcService cleanup
}
