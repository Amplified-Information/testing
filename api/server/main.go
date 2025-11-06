package main

import (
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
	// check PORT env var is available (.config.ENV and .secrets.ENV are loaded):
	if os.Getenv("PORT") == "" || os.Getenv("HEDERA_OPERATOR_KEY") == "" {
		log.Fatalf("Failed to start api. PORT and HEDERA_OPERATOR_KEY must be set.")
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
