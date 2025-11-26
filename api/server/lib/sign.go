package lib

import (
	"encoding/json"
	"fmt"
	"math"
	"math/big"
	"os"
	"strconv"

	"golang.org/x/crypto/sha3"

	pb "api/gen"
)

// func toFixedBytes(v *big.Int, size int) []byte {
// 	b := v.Bytes() // big-endian, no leading zeros
// 	if len(b) > size {
// 		panic("value exceeds fixed size")
// 	}
// 	out := make([]byte, size)
// 	copy(out[size-len(b):], b) // right-align
// 	return out
// }

// func Uuid7_to_bigint(uuid7 string) (*big.Int, error) {
// 	// Remove all hyphens from the UUID7 string
// 	uuid7Cleaned := strings.ReplaceAll(uuid7, "-", "")

// 	// Prefix with 0x to indicate hexadecimal
// 	hexString := "0x" + uuid7Cleaned

// 	// Convert the hexadecimal string to a big.Int
// 	bigIntValue := new(big.Int)
// 	_, success := bigIntValue.SetString(hexString, 0) // Base 0 auto-detects the prefix
// 	if !success {
// 		return nil, fmt.Errorf("failed to convert UUID7 to big.Int: %s", uuid7)
// 	}

// 	return bigIntValue, nil
// }

/*
*
Convenience function to extract signing payload directly from parameters, rather than the full protobuf object.
*/
func ExtractPayloadForSigningUsingParams(marketIdUuid string, priceUsd float64, qty float64, txIdUuid string) ([]byte, error) {
	obj := &pb.PredictionIntentRequest{
		MarketId: marketIdUuid,
		PriceUsd: priceUsd,
		Qty:      qty,
		TxId:     txIdUuid,

		// default dummy values...
		Net:         "testnet",
		GeneratedAt: strconv.FormatInt(int64(0), 10),
		MarketLimit: "limit",
		AccountId:   "0.0.0",
		Sig:         "",
	}
	return ExtractPayloadForSigning(obj)
}

func ExtractPayloadForSigning(req *pb.PredictionIntentRequest) ([]byte, error) {
	CollateralUsdAbsScaled, err := FloatToBigIntScaledDecimals(math.Abs(req.PriceUsd * req.Qty))
	if err != nil {
		return nil, fmt.Errorf("failed to scale PriceUsd: %v", err)
	}

	type ObjForSigning struct {
		CollateralUsdAbsScaled string `json:"collateralUsd_abs_scaled"`
		MarketIdUUID           string `json:"marketId_uuid"`
		TxIdUUID               string `json:"txId_uuid"`
	}
	obj := ObjForSigning{
		CollateralUsdAbsScaled: CollateralUsdAbsScaled.String(),
		MarketIdUUID:           req.MarketId,
		TxIdUUID:               req.TxId,
	}

	// Marshal ObjForSigning to JSON
	resultBytes, err := json.Marshal(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ObjForSigning: %v", err)
	}

	return resultBytes, nil
}

// func ExtractPayloadForSigning(req *pb.PredictionIntentRequest) ([]byte, error) {
// 	// see corresponding front-end code: ./lib/sign.ts
// 	type ObjForSigning struct {
// 		MarketId    *big.Int // 128-bit
// 		PriceUsdAbs *big.Int // 256-bit
// 		TxId        *big.Int // 128-bit
// 	}

// 	// Convert UUID7 strings to big.Int
// 	marketIdBigInt, err := Uuid7_to_bigint(req.MarketId)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to convert MarketId: %v", err)
// 	}
// 	txIdBigInt, err := Uuid7_to_bigint(req.TxId)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to convert TxId: %v", err)
// 	}

// 	// Get USDC_DECIMALS from environment variable
// 	usdcDecimalsStr := os.Getenv("USDC_DECIMALS")
// 	usdcDecimals, err := strconv.ParseInt(usdcDecimalsStr, 10, 64)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid USDC_DECIMALS: %w", err)
// 	}

// 	// priceUsd: Operate in float space to avoid precision loss
// 	// then convert to big.Int
// 	priceUsdBigFloat := new(big.Float).SetFloat64(math.Abs(req.PriceUsd) * float64(new(big.Int).Exp(big.NewInt(10), big.NewInt(usdcDecimals), nil).Int64()))
// 	priceUsdBigInt, _ := priceUsdBigFloat.Int(nil) // Convert to big.Int

// 	o := ObjForSigning{
// 		MarketId:    marketIdBigInt, // uint128
// 		PriceUsdAbs: priceUsdBigInt, // uint256
// 		TxId:        txIdBigInt,     // uint128
// 	}

// 	// 8-bits * 16 = 128-bits
// 	// 8-bits * 32 = 256-bits
// 	out := make([]byte, 0, 16+16+32)

// 	// N.B. the order of the fields is critical
// 	out = append(out, toFixedBytes(o.MarketId, 16)...)
// 	out = append(out, toFixedBytes(o.PriceUsdAbs, 32)...)
// 	out = append(out, toFixedBytes(o.TxId, 16)...)

// 	return out, nil
// }

func Keccak256(data []byte) []byte {
	h := sha3.NewLegacyKeccak256()
	h.Write(data)
	return h.Sum(nil) // 32 bytes
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
