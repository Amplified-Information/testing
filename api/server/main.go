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

	hashiService   services.Hashi
	natsService    services.NatsService
	marketsService services.MarketService
}

func (s *server) PredictIntent(ctx context.Context, req *pb_api.PredictionIntentRequest) (*pb_api.StdResponse, error) {
	if err := req.ValidateAll(); err != nil { // PGV validation
		return &pb_api.StdResponse{Message: fmt.Sprintf("Invalid request: %v", err)}, err
	}

	response, err := s.hashiService.SubmitPredictionIntent(req)

	return &pb_api.StdResponse{
		Message: response,
	}, err
}

func (s *server) HealthCheck(ctx context.Context, req *pb_api.Empty) (*pb_api.StdResponse, error) {
	return &pb_api.StdResponse{
		Message: "OK",
	}, nil
}

func (s *server) GetMarkets(ctx context.Context, req *pb_api.LimitOffsetRequest) (*pb_api.MarketsResponse, error) {
	result, err := s.marketsService.GetMarkets(req.GetLimit(), req.GetOffset())
	return result, err
}

func (s *server) GetMarketById(ctx context.Context, req *pb_api.MarketIdRequest) (*pb_api.MarketResponse, error) {
	result, err := s.marketsService.GetMarketById(req.GetMarketId())
	return result, err
}

func (s *server) CreateMarket(ctx context.Context, req *pb_api.NewMarketRequest) (*pb_api.MarketResponse, error) {
	result, err := s.marketsService.CreateMarket(req)
	return result, err
}

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{"HOST", "PORT", "HEDERA_OPERATOR_ID", "HEDERA_OPERATOR_KEY_TYPE", "HEDERA_OPERATOR_KEY", "DB_HOST", "DB_PORT", "DB_UNAME", "DB_PWORD", "DB_NAME", "DB_MAX_ROWS"}
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
	_, err = hederaService.InitHedera()
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

	// initialize NATS
	natsService := services.NatsService{}
	err = natsService.InitNATS(&hederaService, &dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer natsService.CloseNATS()
	// NATS start listening for matches
	natsService.HandleOrderMatches()

	// initialize hashi service
	hashiService := services.Hashi{}
	hashiService.InitHashi(&dbRepository, &natsService, &hederaService)
	// TODO: defer hashiService cleanup

	// initialize price service
	priceService := services.PriceService{}
	err = priceService.InitPriceService(&dbRepository)
	if err != nil {
		log.Fatalf("Failed to initialize Price service: %v", err)
	}

	// sNow start gRPC service
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", os.Getenv("HOST"), os.Getenv("PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Smart contract ID from env: %s", os.Getenv("SMART_CONTRACT_ID"))

	grpcServer := grpc.NewServer()
	pb_api.RegisterApiServiceServer(grpcServer, &server{
		dbRepository: dbRepository,

		hashiService:   hashiService,
		natsService:    natsService,
		marketsService: marketsService,
	})

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("HOST"), os.Getenv("PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	// TODO: defer grpcService cleanup
}
