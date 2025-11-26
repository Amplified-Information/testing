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

// func SplitSignature(signature []byte) (r, s []byte, v byte, err error) {
// 	if len(signature) != 65 {
// 		return nil, nil, 0, fmt.Errorf("invalid signature length: expected 65 bytes, got %d", len(signature))
// 	}
// 	r = signature[:32]
// 	s = signature[32:64]
// 	v = signature[64]
// 	return r, s, v, nil
// }

// func Y() {
// 	// === inputs from HashPack ===
// 	sigHex := "aa5d211fee6e36818db2ceb819f645d1d76e477acd6132dfd5959c5899eeb7d07c6af46faa75127797b2fafbfd9a57267755a87f1839c34ad51ad5995cae4d90"
// 	// pubHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787" // <-- full uncompressed 65-byte public key from HashPack
// 	keccak256, err := hex.DecodeString("ba17275af5559a2fbc518222d46b58d523a9bd64667ab8781cd57ba017f8fc3a")
// 	serializedPayloadPrefixed := []byte("\x19Hedera Signed Message:\n32")
// 	serializedPayloadPrefixed = append(serializedPayloadPrefixed, keccak256...) // <-- serialized payload hex from HashPack

// 	// decode hex sig → []byte
// 	sigBytes, _ := hex.DecodeString(sigHex)

// 	// split into r and s
// 	r := new(big.Int).SetBytes(sigBytes[:32])
// 	s := new(big.Int).SetBytes(sigBytes[32:64])

// 	// decode public key
// 	// pubBytes, _ := hex.DecodeString(pubHex)
// 	// x := new(big.Int).SetBytes(pubBytes[1:33])
// 	// y := new(big.Int).SetBytes(pubBytes[33:65])

// 	privateKeyHex := "1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d"
// 	privateKey, err := crypto.HexToECDSA(privateKeyHex)
// 	if err != nil {
// 		log.Printf("Error decoding private key hex: %v", err)
// 	}
// 	log.Printf("public key (from private key): %x", privateKey.PublicKey.X.Bytes())

// 	pubkey := &ecdsa.PublicKey{
// 		Curve: elliptic.P256(), // WRONG for HashPack! Do NOT use P256
// 	}

// 	// Hedera uses secp256k1
// 	pubkey.Curve = crypto.S256() // correct curve

// 	pubkey.X = privateKey.PublicKey.X
// 	pubkey.Y = privateKey.PublicKey.Y

// 	// Hash the message same way HashPack does:
// 	// hash := sha256.Sum256(message)
// 	hash := crypto.Keccak256(serializedPayloadPrefixed)

// 	// Verify
// 	ok := ecdsa.Verify(pubkey, hash[:], r, s)
// 	fmt.Println("Signature valid?", ok)
// }

// func verifySig() {
// 	// Y()
// 	log.Printf("Hello")
// 	// req := &pb_api.PredictionIntentRequest{
// 	// 	MarketId: "019a7e77-39e2-72a3-9bea-a63bdfa79d20",
// 	// 	TxId:     "019aab9a-e734-700a-87de-b383095ac8c6",
// 	// 	PriceUsd: 0.5,
// 	// 	Qty:      0.02,

// 	// 	AccountId:   "0.0.7090546",
// 	// 	GeneratedAt: "2025-11-22T12:47:27.028Z",
// 	// 	Sig:         "",
// 	// }
// 	// pir, err := json.Marshal(req)
// 	// if err != nil {
// 	// 	log.Printf("Error marshaling JSON: %v", err)
// 	// }
// 	// log.Printf("%s", string(pir))
// 	// serializedPayload, err := lib.ExtractPayloadForSigning(req)
// 	// if err != nil {
// 	// 	log.Printf("Error extracting payload for signing: %v", err)
// 	// }
// 	payloadStr := "019aab9ae734700a87deb383095ac8c6019a7e7739e272a39beaa63bdfa79d20000000000000000000000000000000000000000000000000000000000007a120"
// 	serializedPayload, err := hex.DecodeString(payloadStr)
// 	if err != nil {
// 		log.Fatalf("Error decoding hex string: %v", err)
// 	}
// 	log.Printf("Serialized payload for signing (len=%d): %x", len(serializedPayload), serializedPayload)

// 	keccak256 := crypto.Keccak256(serializedPayload)
// 	log.Printf("Keccak256 of serialized payload (hex) (len=%d): %x", len(keccak256), keccak256)

// 	prefix := "\x19Hedera Signed Message:\n"
// 	payloadLength := byte(len(keccak256))
// 	if payloadLength != 32 {
// 		log.Printf("Unexpected payload length (must be 32): %d", payloadLength)
// 	}
// 	serializedPayloadPrefixed := append([]byte(prefix), payloadLength)
// 	serializedPayloadPrefixed = append(serializedPayloadPrefixed, keccak256...)
// 	// serializedPayloadPrefixed := append([]byte(prefix), keccak256...)
// 	log.Printf("Serialized payload with prefix (len=%d): %x", len(serializedPayloadPrefixed), serializedPayloadPrefixed)
// 	log.Printf("%x", string([]byte(prefix)))
// 	keccak256Prefixed := crypto.Keccak256(serializedPayloadPrefixed)
// 	log.Printf("Keccak256 of serialized payload with prefix (hex) (len=%d): %x", len(keccak256Prefixed), keccak256Prefixed)

// 	privateKeyHex := "1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d"
// 	privateKey, err := crypto.HexToECDSA(privateKeyHex)
// 	if err != nil {
// 		log.Printf("Error decoding private key hex: %v", err)
// 	}
// 	log.Printf("public key (from private key): %x", privateKey.PublicKey.X.Bytes())

// 	publicKeyHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
// 	publicKey, err := hex.DecodeString(publicKeyHex)
// 	if err != nil {
// 		log.Printf("Error decoding public key hex: %v", err)
// 	}
// 	log.Printf("public key (from hex): %x", publicKey)

// 	sigServer, err := crypto.Sign(keccak256Prefixed, privateKey)
// 	if err != nil {
// 		log.Printf("Error signing keccak256: %v", err)
// 	}
// 	log.Printf("Server-side signature (hex) (len=%d): %x", len(sigServer), sigServer)

// 	sigHex := "aa5d211fee6e36818db2ceb819f645d1d76e477acd6132dfd5959c5899eeb7d07c6af46faa75127797b2fafbfd9a57267755a87f1839c34ad51ad5995cae4d90"
// 	sig, err := hex.DecodeString(sigHex)
// 	log.Printf("Client-side signature (hex (len=%d)): %x", len(sig), sig)
// 	if err != nil {
// 		log.Printf("Error decoding signature hex: %v", err)
// 	}

// 	ok := crypto.VerifySignature(privateKey.PublicKey.Y.Bytes(), keccak256, sig)
// 	log.Printf("Signature valid: %v", ok)
// 	ok = crypto.VerifySignature(privateKey.PublicKey.Y.Bytes(), keccak256Prefixed, sig)
// 	log.Printf("Signature valid: %v", ok)

// 	r, s, v, err := SplitSignature(sigServer)
// 	if err != nil {
// 		log.Printf("Error splitting signature: %v", err)
// 	}
// 	log.Printf("Signature components:\n r: %x\n s: %x\n v: %d", r, s, v)

// 	payloadx := "hello"
// 	payloadxKeccak := crypto.Keccak256([]byte(payloadx))
// 	log.Printf("payloadxKeccak (hex) (len=%d): %x", len(payloadxKeccak), payloadxKeccak)

// 	sigx, err := crypto.Sign(payloadxKeccak, privateKey)
// 	if err != nil {
// 		log.Printf("Error signing payloadxKeccak: %v", err)
// 	}
// 	log.Printf("sigx (hex) (len=%d): %x", len(sigx), sigx)

// 	log.Fatalf("exit")
// }

// func main() {
// 	verifySig()
// }

func main() {
	// check env vars are available (.config.ENV and .secrets.ENV are loaded):
	vars := []string{"HOST", "PORT", "HEDERA_OPERATOR_ID", "HEDERA_OPERATOR_KEY_TYPE", "HEDERA_OPERATOR_KEY", "DB_HOST", "DB_PORT", "DB_UNAME", "DB_PWORD", "DB_NAME"}
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

	log.Printf("Smart contract ID from env: %s", os.Getenv("SMART_CONTRACT_ID"))

	grpcServer := grpc.NewServer()
	pb_api.RegisterApiServiceServer(grpcServer, &server{hashiService: hashiService, dbService: dbService, natsService: natsService})

	log.Printf("✅ gRPC server running on %s:%s", os.Getenv("HOST"), os.Getenv("PORT"))
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
	// TODO: defer grpcService cleanup
}
