package lib

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/hiero-ledger/hiero-sdk-go/v2/proto/services"
	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
	"golang.org/x/crypto/sha3"

	protobuf "google.golang.org/protobuf/proto"
)

/*
Convenience function to extract signing payload directly from parameters, rather than the full protobuf object.
*/
// func ExtractPayloadForSigningUsingParams(marketIdUuid string, priceUsd float64, qty float64, txIdUuid string) ([]byte, error) {
// 	obj := &pb.PredictionIntentRequest{
// 		MarketId: marketIdUuid,
// 		PriceUsd: priceUsd,
// 		Qty:      qty,
// 		TxId:     txIdUuid,

// 		// default dummy values...
// 		Net:         "testnet",
// 		GeneratedAt: strconv.FormatInt(int64(0), 10),
// 		MarketLimit: "limit",
// 		AccountId:   "0.0.0",
// 		Sig:         "",
// 	}
// 	return ExtractPayloadForSigning(obj)
// }

// func ExtractPayloadForSigning(req *pb.PredictionIntentRequest) ([]byte, error) {
// 	CollateralUsdAbsScaled, err := FloatToBigIntScaledDecimals(math.Abs(req.PriceUsd * req.Qty))
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to scale PriceUsd: %v", err)
// 	}

// 	type ObjForSigning struct {
// 		CollateralUsdAbsScaled string `json:"collateralUsd_abs_scaled"`
// 		MarketIdUUID           string `json:"marketId_uuid"`
// 		TxIdUUID               string `json:"txId_uuid"`
// 		// Qty
// 	}
// 	obj := ObjForSigning{
// 		CollateralUsdAbsScaled: CollateralUsdAbsScaled.String(),
// 		MarketIdUUID:           req.MarketId,
// 		TxIdUUID:               req.TxId,
// 	}

// 	// Marshal ObjForSigning to JSON
// 	resultBytes, err := json.Marshal(obj)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to marshal ObjForSigning: %v", err)
// 	}

// 	return resultBytes, nil
// }

func AssemblePayloadHexForSigning(collateralUsdAbsScaled_256 *big.Int, marketId string, txId string) (string, error) {
	marketIdBigInt_128, err := Uuid7_to_bigint(marketId)
	if err != nil {
		return "", fmt.Errorf("failed to convert MarketId: %v", err)
	}

	txIdBigInt_128, err := Uuid7_to_bigint(txId)
	if err != nil {
		return "", fmt.Errorf("failed to convert TxId: %v", err)
	}

	// this string is the correct fixed length
	payloadHex := "0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000002019aeb40e8e9769cb7a1087ecb6d0bd6"

	payloadHex = fmt.Sprintf( // beautiful :)
		"%064x%032x%032x",
		collateralUsdAbsScaled_256,
		marketIdBigInt_128,
		txIdBigInt_128,
	)
	return payloadHex, nil
}

func Uuid7_to_bigint(uuid7 string) (*big.Int, error) {
	// Remove all hyphens from the UUID7 string
	uuid7Cleaned := strings.ReplaceAll(uuid7, "-", "")

	// Prefix with 0x to indicate hexadecimal
	hexString := "0x" + uuid7Cleaned

	// Convert the hexadecimal string to a big.Int
	bigIntValue := new(big.Int)
	_, success := bigIntValue.SetString(hexString, 0) // Base 0 auto-detects the prefix
	if !success {
		return nil, fmt.Errorf("failed to convert UUID7 to big.Int: %s", uuid7)
	}

	return bigIntValue, nil
}

// func nudgeStrForSigning(keccakHex string) string {
// 	// Input keccakHex string
// 	// keccakHex := "82f2421684ffafb2fba374c79fa3c718fe8cb4a082f5d4aa056c6565fc487e1b"
// 	// returns: efbfbdefbfbd4216efbfbdefbfbdefbfbdefbfbdefbfbdefbfbd74c79fefbfbdefbfbd18efbfbdefbfbdefbfbdefbfbdefbfbdefbfbdd4aa056c6565efbfbd487e1b

// 	// Decode the hex string into bytes
// 	keccakBytes, err := hex.DecodeString(keccakHex)
// 	if err != nil {
// 		fmt.Printf("Error decoding hex string: %v\n", err)
// 		return ""
// 	}

// 	// Replace invalid UTF-8 sequences
// 	validUtf8Bytes := replaceInvalidUTF8(keccakBytes)

// 	// Convert the UTF-8 bytes back to a hex string
// 	validUtf8Hex := hex.EncodeToString(validUtf8Bytes)

// 	return validUtf8Hex
// }

// func replaceInvalidUTF8(input []byte) []byte {
// 	validUtf8 := make([]byte, 0, len(input))
// 	for len(input) > 0 {
// 		r, size := utf8.DecodeRune(input)
// 		if r == utf8.RuneError && size == 1 {
// 			// Replace invalid byte with the UTF-8 replacement character
// 			validUtf8 = append(validUtf8, []byte("\uFFFD")...)
// 			input = input[size:]
// 		} else {
// 			validUtf8 = append(validUtf8, input[:size]...)
// 			input = input[size:]
// 		}
// 	}
// 	return validUtf8
// }

func PrefixMessageToSign(messageStr string) string {
	msg := fmt.Sprintf("\x19Hedera Signed Message:\n44%s", messageStr) // fixed length 44 for base64-encoded keccak256 hash
	return msg
}

// OLD - varying N was not acceptable for on-chain assembly and sig verification..
// func PrefixMessageToSign(messageUtf8NotNudged string, N int) string {
// 	messageUtf8 := nudgeStrForSigning(messageUtf8NotNudged)

// 	// Convert the hex string messageUtf8 to a UTF-8 string
// 	messageStr, err := Hex2utf8(messageUtf8)
// 	if err != nil {
// 		fmt.Printf("Error converting hex to UTF-8: %v\n", err)
// 		return ""
// 	}

// 	msg := fmt.Sprintf("\x19Hedera Signed Message:\n%d%s", N, messageStr)
// 	return msg
// }

func Keccak256(data []byte) []byte {
	h := sha3.NewLegacyKeccak256()
	h.Write(data)
	return h.Sum(nil) // 32 bytes
}

// function buildSignatureMap(publicKey: PublicKey, signature: Uint8Array) {
//   // const signature = privateKey.sign(message)
//   // console.log(`signature: ${Buffer.from(signature).toString('hex')}`)

//   const sigPair = proto.SignaturePair.create({
//     pubKeyPrefix: publicKey.toBytesRaw(),            // prefix = full key
//     ECDSASecp256k1: signature                        // OR ed25519 depending on key type
//   })

//   const sigMap = proto.SignatureMap.create({
//     sigPair: [sigPair]
//   })

//   const bytes = proto.SignatureMap.encode(sigMap).finish()
//   return bytes
// }

func BuildSignatureMap(publicKey *hiero.PublicKey, signatureBytes []byte, keyType HederaKeyType) ([]byte, error) {
	// sigPairs := make([]*services.SignaturePair, 0)

	// sigPair := &services.SignaturePair{}
	sigMap := &services.SignatureMap{}
	// proto.SignaturePair{}

	switch keyType {
	case KEY_TYPE_ECDSA:
		fmt.Println("ECDSA")
		// ECDSASecp256k1 := &services.SignaturePair_ECDSASecp256K1{
		// 	ECDSASecp256K1: signatureBytes,
		// }

		// sigPair = &services.SignaturePair{
		// 	PubKeyPrefix: publicKey.Bytes(),
		// 	Signature:    ECDSASecp256k1,
		// }
		ecdsaPair := &services.SignaturePair_ECDSASecp256K1{
			ECDSASecp256K1: signatureBytes,
		}

		sigPair := &services.SignaturePair{
			PubKeyPrefix: publicKey.BytesRaw(), // or Bytes(), depending on your key source
			Signature:    ecdsaPair,
		}

		sigMap = &services.SignatureMap{
			SigPair: []*services.SignaturePair{sigPair},
		}

	case KEY_TYPE_ED25519:
		fmt.Println("ED25519")
		// ED25519 := &services.SignaturePair_Ed25519{
		// 	Ed25519: signatureBytes,
		// }

		// sigPair = &services.SignaturePair{
		// 	PubKeyPrefix: publicKey.Bytes(),
		// 	Signature:    ED25519,
		// }
		ed25519Pair := &services.SignaturePair_Ed25519{
			Ed25519: signatureBytes,
		}

		sigPair := &services.SignaturePair{
			PubKeyPrefix: publicKey.BytesRaw(), // or Bytes(), depending on your key source
			Signature:    ed25519Pair,
		}

		sigMap = &services.SignatureMap{
			SigPair: []*services.SignaturePair{sigPair},
		}
	default:
		return nil, fmt.Errorf("unsupported keyType: %d", keyType)
	}

	// sigMap := &services.SignatureMap{
	// 	SigPair: []*services.SignaturePair{sigPair},
	// }

	// protobuf.Marshal(sigMap)

	// return protobuf.Marshal(sigMap) //  []byte(sigMap.String()), nil

	bytes, err := protobuf.Marshal(sigMap)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}
