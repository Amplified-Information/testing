package lib

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"math/big"
	"net/http"
	"os"
	"strconv"

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

var GloboMarshaler = protojson.MarshalOptions{
	UseProtoNames:   false, // Use json_name annotations
	EmitUnpopulated: false, // Don't include zero values
	Indent:          "",    // Ensure compact JSON with no indentation or spaces
	Multiline:       false, // Ensure single-line JSON
}

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
	jsonBytes, err := GloboMarshaler.Marshal(req)
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

func FloatToBigIntScaledDecimals(value float64) (*big.Int, error) {
	// scale the float64s for the number of USDC_DECIMALS
	usdcDecimalsStr := os.Getenv("USDC_DECIMALS")
	usdcDecimals, err := strconv.ParseInt(usdcDecimalsStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid USDC_DECIMALS: %w", err)
	}

	scaledValue := new(big.Float).Mul(big.NewFloat(value), new(big.Float).SetFloat64(math.Pow10(int(usdcDecimals))))
	bigIntValue, _ := scaledValue.Int(nil)
	return bigIntValue, nil
}

// hex2utf8 converts a hex string to a UTF-8 string.
// Invalid byte sequences are replaced with the Unicode replacement character.
func Hex2utf8(hexStr string) (string, error) {
	// Decode the hex string into bytes
	bytes, err := hex.DecodeString(hexStr)
	if err != nil {
		return "", fmt.Errorf("failed to decode hex string: %w", err)
	}

	// Convert bytes to a UTF-8 string
	utf8Str := string(bytes)
	return utf8Str, nil
}

// utf82hex converts a UTF-8 string back to a hex string.
func Utf82hex(utf8Str string) string {
	// Convert the UTF-8 string to bytes
	bytes := []byte(utf8Str)

	// Encode the bytes as a hex string
	hexStr := hex.EncodeToString(bytes)
	return hexStr
}
