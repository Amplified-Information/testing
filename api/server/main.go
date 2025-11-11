package main

import (
	"api/server/lib"
	"api/server/services"
	"context"
	"fmt"
	"log"
	"net"
	"os"

	pb "api/gen"

	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedApiServiceServer
	hashiService services.Hashi
	dbService    services.DbService
	natsService  services.NatsService
}

func (s *server) PredictIntent(ctx context.Context, req *pb.PredictionIntentRequest) (*pb.StdResponse, error) {
	if err := req.ValidateAll(); err != nil { // PGV validation
		return &pb.StdResponse{Message: fmt.Sprintf("Invalid request: %v", err)}, err
	}

	response, err := s.hashiService.SubmitPredictionIntent(req)

	return &pb.StdResponse{
		Message: response,
	}, err
}

func (s *server) HealthCheck(ctx context.Context, req *pb.Empty) (*pb.StdResponse, error) {
	return &pb.StdResponse{
		Message: "OK",
	}, nil
}

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{"HOST", "PORT", "HEDERA_OPERATOR_KEY", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"}
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

	// initialize NATS
	natsService := services.NatsService{}
	err = natsService.InitNATS()
	if err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer natsService.CloseNATS()

	// NATS start listening for matches
	natsService.HandleOrderMatches(lib.NATS_CLOB_MATCHES)

	// initialize hashi service
	hashiService := services.Hashi{}
	hashiService.InitHashi(&dbService, &natsService)

	// sNow start gRPC service
	lis, err := net.Listen("tcp", fmt.Sprintf("%s:%s", os.Getenv("HOST"), os.Getenv("PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterApiServiceServer(grpcServer, &server{hashiService: hashiService, dbService: dbService, natsService: natsService})

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("HOST"), os.Getenv("PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
