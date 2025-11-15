package main

import (
	"api/server/services"
	"context"
	"fmt"
	"log"
	"net"
	"os"

	pb_api "api/gen"

	"google.golang.org/grpc"
)

type server struct {
	pb_api.UnimplementedApiServiceServer
	hashiService services.Hashi
	dbService    services.DbService
	natsService  services.NatsService
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

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{"HOST", "PORT", "HEDERA_OPERATOR_KEY", "DB_HOST", "DB_PORT", "DB_UNAME", "DB_PWORD", "DB_NAME"}
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

	// initialize database
	dbService := services.DbService{}
	err = dbService.InitDb()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbService.CloseDb()

	// initialize Hedera service
	hederaService := services.HederaService{}
	_, err = hederaService.InitHedera()
	if err != nil {
		log.Fatalf("Failed to initialize Hedera service: %v", err)
	}
	// TODO: defer hederaService cleanup

	// initialize NATS
	natsService := services.NatsService{}
	err = natsService.InitNATS(&hederaService, &dbService)
	if err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer natsService.CloseNATS()
	// NATS start listening for matches
	natsService.HandleOrderMatches()

	// initialize hashi service
	hashiService := services.Hashi{}
	hashiService.InitHashi(&dbService, &natsService, &hederaService)
	// TODO: defer hashiService cleanup

	// sNow start gRPC service
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", os.Getenv("HOST"), os.Getenv("PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb_api.RegisterApiServiceServer(grpcServer, &server{hashiService: hashiService, dbService: dbService, natsService: natsService})

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("HOST"), os.Getenv("PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	// TODO: defer grpcService cleanup
}
