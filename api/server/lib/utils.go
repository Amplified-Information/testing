package lib

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"

	pb "api/gen"
)

func PrettyJSON(input string) string {
	var obj interface{}
	if err := json.Unmarshal([]byte(input), &obj); err != nil {
		log.Println("Invalid JSON:", err)
		return input
	}

	pretty, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		log.Println("Error pretty printing:", err)
		return input
	}

	return string(pretty)
}

// SerializePredictionRequestSansSigForSigning creates a base64-encoded JSON string of the request with empty signature
// This matches the serialization done in Signer.tsx for signature verification
// Serialize to JSON and encode to base64 (similar to how Signer.tsx does it)
func SerializePredictionRequest_SansSig_ForSigning(req *pb.PredictionIntentRequest) (string, error) {
	// N.B. First temporarily clear the Sig field completely before serialization
	originalSig := req.Sig
	req.Sig = ""
	defer func() {
		req.Sig = originalSig
	}()

	jsonBytes, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to serialize request: %v", err)
	}
	serializedMessageBase64 := base64.StdEncoding.EncodeToString(jsonBytes)

	return serializedMessageBase64, nil
}

func DeserializePredictionRequestFromSigning(serializedMessageBase64 string) (string, error) {
	// Decode from base64
	jsonBytes, err := base64.StdEncoding.DecodeString(serializedMessageBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %v", err)
	}

	// Unmarshal JSON to PredictionIntentRequest
	var req pb.PredictionIntentRequest
	if err := json.Unmarshal(jsonBytes, &req); err != nil {
		return "", fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	// Do NOT pretty print the request as JSON string!!!
	// prettyJSONBytes, err := json.MarshalIndent(req, "", "  ")
	// if err != nil {
	// 	return "", fmt.Errorf("failed to pretty print JSON: %v", err)
	// }

	return string(jsonBytes), nil
}
