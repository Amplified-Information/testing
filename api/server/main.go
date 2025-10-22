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
	if err := godotenv.Load(".env", ".secrets"); err != nil { // Load environment variables from .env and .secrets
		log.Printf("Warning: Could not load .env file: %v", err)
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
