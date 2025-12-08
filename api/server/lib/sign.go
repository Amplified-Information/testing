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

func PrefixMessageToSign(messageStr string) string {
	msg := fmt.Sprintf("\x19Hedera Signed Message:\n44%s", messageStr) // fixed length 44 for base64-encoded keccak256 hash
	return msg
}

func Keccak256(data []byte) []byte {
	h := sha3.NewLegacyKeccak256()
	h.Write(data)
	return h.Sum(nil) // 32 bytes
}

func BuildSignatureMap(publicKey *hiero.PublicKey, signatureBytes []byte, keyType HederaKeyType) ([]byte, error) {
	sigMap := &services.SignatureMap{}

	switch keyType {
	case KEY_TYPE_ECDSA:
		// fmt.Println("ECDSA")

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
		// fmt.Println("ED25519")
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

	bytes, err := protobuf.Marshal(sigMap)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}
