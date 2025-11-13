package lib

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	pb "api/gen"

	"google.golang.org/protobuf/encoding/protojson"
)

type HTTPMethod string

const (
	GET    HTTPMethod = "GET"
	POST   HTTPMethod = "POST"
	PUT    HTTPMethod = "PUT"
	PATCH  HTTPMethod = "PATCH"
	DELETE HTTPMethod = "DELETE"
)

func Fetch(method HTTPMethod, url string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest(string(method), url, body)
	if err != nil {
		return nil, err
	}
	return http.DefaultClient.Do(req)
}

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

// JsonMarshaller marshals protobuf messages to JSON using protojson to respect json_name annotations
// Produces compact JSON without spaces for signature verification compatibility
func JsonMarshaller(req *pb.PredictionIntentRequest) ([]byte, error) {
	marshaler := protojson.MarshalOptions{
		UseProtoNames:   false, // Use json_name annotations
		EmitUnpopulated: false, // Don't include zero values
		Indent:          "",    // Ensure compact JSON with no indentation or spaces
		Multiline:       false, // Ensure single-line JSON
	}

	jsonBytes, err := marshaler.Marshal(req)
	if err != nil {
		return nil, err
	}

	// TODO - this is a hack:
	jsonBytesNoSpacesBetweenFields := bytes.ReplaceAll(jsonBytes, []byte(" "), []byte(""))

	return jsonBytesNoSpacesBetweenFields, nil
}

// SerializePredictionRequestSansSigForSigning creates a base64-encoded JSON string of the request with empty signature
// Matches the serialization done in Signer.tsx for signature verification
// Serialize to JSON to base64 encoding, exclude Sig field (similar to how Signer.tsx does it)
func Serialize64PredictionRequest_SansSig_ForSigning(req *pb.PredictionIntentRequest) (string, error) {
	// N.B. First temporarily clear the Sig field completely before serialization
	originalSig := req.Sig
	req.Sig = ""
	defer func() {
		req.Sig = originalSig
	}()

	jsonBytes, err := JsonMarshaller(req)
	if err != nil {
		return "", fmt.Errorf("failed to serialize request: %v", err)
	}

	log.Printf("DEBUG: Go backend JSON for signing: %s", string(jsonBytes))
	serializedMessageBase64 := base64.StdEncoding.EncodeToString(jsonBytes)

	return serializedMessageBase64, nil
}

func Int64ToBytes(n int64) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(n))
	return b
}

func BytesToInt64(b []byte) int64 {
	return int64(binary.BigEndian.Uint64(b))
}
