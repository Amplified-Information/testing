package main

import (
	"api/server/services"
	"context"
	"fmt"
	"log"
	"net"
	"os"

	pb "api/gen"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedApiServiceServer
}

func (s *server) PredictIntent(ctx context.Context, req *pb.PredictionIntentRequest) (*pb.StdResponse, error) {
	if err := req.ValidateAll(); err != nil { // PGV validation
		return &pb.StdResponse{Message: fmt.Sprintf("Invalid request: %v", err)}, err
	}

	response, err := services.SubmitPredictionIntent(req)

	return &pb.StdResponse{
		Message: response,
	}, err
}

func main() {
	result := os.Getenv("ENV")
	if result == "" {
		log.Fatalf("Failed to start api. ENV {local, dev, prod} must be set.")
	}

	if err := godotenv.Load(fmt.Sprintf(".config.%s", os.Getenv("ENV")), fmt.Sprintf(".secrets.%s", os.Getenv("ENV"))); err != nil { // Load environment variables from .config.ENV and .secrets.ENV
		log.Printf("Warning: Could not load .config/.secrets file: %v", err)
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", os.Getenv("PORT")))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterApiServiceServer(grpcServer, &server{})

	log.Printf("✅ gRPC server running on :%s", os.Getenv("PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
