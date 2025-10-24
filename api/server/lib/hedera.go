package lib

import (
	// "encoding/hex"

	"encoding/base64"
	"encoding/json"
	"fmt"

	// "math/big"
	"os"

	// "crypto/ecdsa" // Go’s standard library doesn’t include secp256k1
	// "github.com/decred/dcrd/dcrec/secp256k1/v4"
	// "golang.org/x/crypto/sha3"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

// privateKey (hex):	1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d
// publicKey (hex):		03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787
// message (string): 	hello
// signature (utf-8): NsiQSJWWx+SrZK3OsxdbIgNgxch//+RoRk6BZG5gsrJy1NoE7d1OKW/d4/Jo5lu/amkPp8zWzTB4PKTi1BRSZw==
// signature (base64): 2e//YBNUI73pfAnY3Eoh+sAGV8naXuCjfj8+JjByVGFwckhE2ICgs9YYoapxVuR2Qnq+4yxheLSSfa4TXObT+A==
// const ecdsaPublicKeyPreamble = "302d300706052b8104000a032200"

// func hashpackMessageBytes(message string) []byte {
// 	prefix := fmt.Sprintf("\x19Hedera Signed Message:\n%d", len(message))
// 	return []byte(prefix + message)
// }

// func Test2() {
// 	pubKeyHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
// 	message := "aGVsbG8="
// 	sigBase64 := "2e//YBNUI73pfAnY3Eoh+sAGV8naXuCjfj8+JjByVGFwckhE2ICgs9YYoapxVuR2Qnq+4yxheLSSfa4TXObT+A=="

// 	ok, err := VerifyHashPackSignature(pubKeyHex, message, sigBase64)
// 	if err != nil {
// 		panic(err)
// 	}
// 	fmt.Printf("verified: %b\n", ok)
// }

func VerifySignature(pubKeyHex string, message64 string, sigBase64 string) (bool, error) {
	// pubKeyHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
	// message := "aGVsbG8=" // hello
	// sigBase64 := "2e//YBNUI73pfAnY3Eoh+sAGV8naXuCjfj8+JjByVGFwckhE2ICgs9YYoapxVuR2Qnq+4yxheLSSfa4TXObT+A=="

	isSigValid, err := VerifyHashPackSignature(pubKeyHex, message64, sigBase64)
	if err != nil {
		return false, err
	}
	// fmt.Printf("verified: %b\n", ok)
	return isSigValid, nil
}

// VerifyHashPackSignature verifies a HashPack signature for a given message and ECDSA public key
// pubKeyHex: compressed Hedera ECDSA public key (33 bytes, hex string)
// message: the original message that was signed
// sigBase64: the Base64 R||S signature from HashPack
func VerifyHashPackSignature(pubKeyHex string, message string, sigBase64 string) (bool, error) {
	// Decode Base64 signature
	sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}
	if len(sigBytes) != 64 {
		return false, fmt.Errorf("unexpected signature length: %d", len(sigBytes))
	}

	// Parse Hedera ECDSA public key
	pubKey, err := hiero.PublicKeyFromStringECDSA(pubKeyHex)
	if err != nil {
		return false, fmt.Errorf("failed to parse public key: %w", err)
	}

	// Construct the exact signed message bytes (Hedera WalletConnect prefix)
	prefixed := []byte(fmt.Sprintf("\x19Hedera Signed Message:\n%d%s", len(message), message))

	// Verify signature
	verified := pubKey.VerifySignedMessage(prefixed, sigBytes)
	return verified, nil
}

// func Test2() {
// 	msg := []byte("hello")
// 	hash := sha256.Sum256(msg)

// 	// Signature from TypeScript / HashPack
// 	sigBase64 := "NsiQSJWWx+SrZK3OsxdbIgNgxch//+RoRk6BZG5gsrJy1NoE7d1OKW/d4/Jo5lu/amkPp8zWzTB4PKTi1BRSZw=="
// 	sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
// 	if err != nil {
// 		panic(err)
// 	}

// 	if len(sigBytes) != 64 {
// 		panic("unexpected signature length")
// 	}

// 	// Split raw signature into R and S
// 	r := new(big.Int).SetBytes(sigBytes[:32])
// 	s := new(big.Int).SetBytes(sigBytes[32:])

// 	// Hex public key string
// 	pubKeyHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
// 	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
// 	if err != nil {
// 		panic(err)
// 	}

// 	// Parse compressed secp256k1 public key
// 	// Convert compressed pubkey to uncompressed X||Y (64 bytes) for Ethereum secp256k1
// 	pubKey, _ := secp256k1.DecompressPubkey(pubKeyBytes)

// 	// Verify signature
// 	verified := ecdsa.Verify((*ecdsa.PublicKey)(pubKey), hash[:], r, s)
// 	fmt.Println("Signature verified:", verified)

// }

// func Test() {
// 	// publicKey, err := hiero.PublicKeyFromStringECDSA("302d300706052b8104000a0322000298c5d6efb814ead640467934b5ef9a02b81d3c483719675cb261cc5fde3edd57")
// 	// if err != nil {
// 	// 	fmt.Printf("Error parsing public key: %v\n", err)
// 	// 	return
// 	// }

// 	// fmt.Printf("Public key: %v\n", publicKey)

// 	// key, err := hiero.PrivateKeyGenerateEcdsa()

// 	// publicKey1 := key.PublicKey()
// 	// publicKey2, err := hiero.PublicKeyFromStringECDSA(publicKey1.String())

// 	// fmt.Printf("publicKey1: %s\n", publicKey1)
// 	// fmt.Printf("publicKey2: %s\n", publicKey2)

// 	// testMsg1 := []byte("aGVsbG8=")
// 	testMsg2 := []byte("hello")

// 	privateKey3, err := hiero.PrivateKeyFromStringECDSA("1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d")
// 	fmt.Printf("privateKey3: %s\n", privateKey3)
// 	publicKey3, err := hiero.PublicKeyFromStringECDSA("03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787")
// 	fmt.Printf("publicKey3: %s\n", publicKey3)
// 	fmt.Printf("publicKey3: %s\n", privateKey3.PublicKey())

// 	// sig1 := privateKey3.Sign(testMsg1)
// 	// fmt.Printf("sig1: %s\n", base64.StdEncoding.EncodeToString(sig1))
// 	sig2 := privateKey3.Sign(testMsg2)
// 	fmt.Printf("sig2: %s\n", base64.StdEncoding.EncodeToString(sig2))

// 	sig3 := "NsiQSJWWx+SrZK3OsxdbIgNgxch//+RoRk6BZG5gsrJy1NoE7d1OKW/d4/Jo5lu/amkPp8zWzTB4PKTi1BRSZw=="
// 	fmt.Printf("sig3: %s\n", sig3)
// 	sigBytes, err := base64.StdEncoding.DecodeString(sig3)
// 	if err != nil {
// 		fmt.Printf("Error decoding signature: %v\n", err)
// 		return
// 	}

// 	verified := publicKey3.VerifySignedMessage(testMsg2, sigBytes)
// 	fmt.Printf("Signature verified: %v\n", verified)
// }

type PublicKey struct {
	KeyType string
	Key     string
}

// type _ECDSAPublicKey struct {
// 	*secp256k1.PublicKey
// }

// type Hash [32]byte

// func (h Hash) Bytes() []byte {
// 	return h[:]
// }

func GetPublicKey(accountId string) (PublicKey, error) {
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s", os.Getenv("HEDERA_NETWORK_SELECTED"), accountId)
	resp, err := Fetch(GET, mirrorNodeURL, nil)

	if err != nil {
		return PublicKey{}, fmt.Errorf("failed to query mirror node: %v", err)
	}

	if resp.StatusCode != 200 {
		return PublicKey{}, fmt.Errorf("mirror node returned status code %d", resp.StatusCode)
	}

	var result struct {
		Key struct {
			Key   string `json:"key"`
			Type_ string `json:"_type"`
		} `json:"key"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return PublicKey{}, fmt.Errorf("failed to parse mirror node response: %v", err)
	}

	return PublicKey{KeyType: result.Key.Type_, Key: result.Key.Key}, nil
}


func GetSpenderAllowanceUsd(networkSelected hiero.LedgerID, accountId hiero.AccountID, smartContractId hiero.ContractID, usdcAddress hiero.AccountID, usdcDecimals int) (float64, error) {
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s/allowances/tokens?spender.id=eq:%s&token.id=eq:%s", networkSelected.String(), accountId.String(), smartContractId.String(), usdcAddress.String())
	
	resp, err := Fetch(GET, mirrorNodeURL, nil)
	if err != nil {
		return 0, fmt.Errorf("error fetching allowance: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return 0, fmt.Errorf("network response was not ok: status %d", resp.StatusCode)
	}

	var result struct {
		Allowances []struct {
			Amount int64 `json:"amount"`
		} `json:"allowances"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Allowances) == 0 {
		return 0, nil
	}

	// Convert to float64 and apply decimals
	divisor := 1
	for i := 0; i < usdcDecimals; i++ {
		divisor *= 10
	}
	amount := float64(result.Allowances[0].Amount) / float64(divisor)
	return amount, nil
}

// // https://github.com/hiero-ledger/hiero-sdk-go/blob/7052a2a5cffcf0a6df57336584c50138738ab9b5/sdk/crypto_unit_test.go#L245
// func Test() {
// 	const testPublicKeyStr = "302a300506032b6570032100e0c8ec2758a5879ffac226a13c0c516b799e72e35141a0dd828f94d37988a4b7"

// 	pubKey, _ := PublicKeyFromString(testPublicKeyStr)
// 	pubKey.VerifySignedMessage(testSignData, signature)
// }

// // https://github.com/hiero-ledger/hiero-sdk-go/blob/7052a2a5cffcf0a6df57336584c50138738ab9b5/sdk/crypto.go#L421C1-L430C2
// func PublicKeyFromStringECDSA(s string) (PublicKey, error) {
// 	key, err := _ECDSAPublicKeyFromString(s)
// 	if err != nil {
// 		return PublicKey{}, err
// 	}

// 	return PublicKey{
// 		ecdsaPublicKey: key,
// 	}, nil
// }
// // https://github.com/hiero-ledger/hiero-sdk-go/blob/7052a2a5cffcf0a6df57336584c50138738ab9b5/sdk/ecdsa_public_key.go#L151
// func _ECDSAPublicKeyFromString(s string) (*_ECDSAPublicKey, error) {
// 	byt, err := hex.DecodeString(s)
// 	if err != nil {
// 		return &_ECDSAPublicKey{}, err
// 	}

// 	return _ECDSAPublicKeyFromBytes(byt)
// }

// func _ECDSAPublicKeyFromBytes(byt []byte) (*_ECDSAPublicKey, error) {
// 	length := len(byt)
// 	switch length {
// 	case 33:
// 		return _ECDSAPublicKeyFromBytesRaw(byt)
// 	case 47:
// 		return _LegacyECDSAPublicKeyFromBytesDer(byt)
// 	case 56:
// 		return _ECDSAPublicKeyFromBytesDer(byt)
// 	default:
// 		return &_ECDSAPublicKey{}, _NewErrBadKeyf("invalid compressed ECDSA public key length: %v bytes", len(byt))
// 	}
// }

// func _ECDSAPublicKeyFromBytesRaw(byt []byte) (*_ECDSAPublicKey, error) {
// 	if byt == nil {
// 		return &_ECDSAPublicKey{}, errByteArrayNull
// 	}
// 	if len(byt) != 33 {
// 		return &_ECDSAPublicKey{}, _NewErrBadKeyf("invalid public key length: %v bytes", len(byt))
// 	}

// 	key, err := secp256k1.ParsePubKey(byt)
// 	if err != nil {
// 		return &_ECDSAPublicKey{}, fmt.Errorf("invalid public key")
// 	}

// 	return &_ECDSAPublicKey{
// 		key,
// 	}, nil
// }

// func _LegacyECDSAPublicKeyFromBytesDer(byt []byte) (*_ECDSAPublicKey, error) {
// 	if byt == nil {
// 		return &_ECDSAPublicKey{}, errByteArrayNull
// 	}

// 	given := hex.EncodeToString(byt)
// 	result := strings.ReplaceAll(given, _LegacyECDSAPubKeyPrefix, "")
// 	decoded, err := hex.DecodeString(result)
// 	if err != nil {
// 		return &_ECDSAPublicKey{}, err
// 	}

// 	if len(decoded) != 33 {
// 		return &_ECDSAPublicKey{}, _NewErrBadKeyf("invalid public key length: %v bytes", len(byt))
// 	}

// 	key, err := secp256k1.ParsePubKey(decoded)
// 	if err != nil {
// 		return &_ECDSAPublicKey{}, err
// 	}

// 	return &_ECDSAPublicKey{
// 		key,
// 	}, nil
// }
// func _ECDSAPublicKeyFromBytesDer(byt []byte) (*_ECDSAPublicKey, error) {
// 	if byt == nil {
// 		return &_ECDSAPublicKey{}, errByteArrayNull
// 	}

// 	type AlgorithmIdentifier struct {
// 		Algorithm  asn1.ObjectIdentifier
// 		Parameters asn1.ObjectIdentifier
// 	}

// 	type PublicKeyInfo struct {
// 		AlgorithmIdentifier AlgorithmIdentifier
// 		PublicKey           asn1.BitString
// 	}

// 	key := &PublicKeyInfo{}
// 	_, err := asn1.Unmarshal(byt, key)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// Check if the parsed key uses ECDSA public key algorithm
// 	ecdsaPublicKeyAlgorithmOID := asn1.ObjectIdentifier{1, 2, 840, 10045, 2, 1}
// 	if !key.AlgorithmIdentifier.Algorithm.Equal(ecdsaPublicKeyAlgorithmOID) {
// 		return nil, errors.New("public key is not an ECDSA public key")
// 	}

// 	// Check if the parsed key uses secp256k1 curve
// 	secp256k1OID := asn1.ObjectIdentifier{1, 3, 132, 0, 10}
// 	if !key.AlgorithmIdentifier.Parameters.Equal(secp256k1OID) {
// 		return nil, errors.New("public key is not a secp256k1 public key")
// 	}

// 	// Check if the public key is compressed and decompress it if necessary
// 	var pubKeyBytes []byte
// 	if key.PublicKey.Bytes[0] == 0x02 || key.PublicKey.Bytes[0] == 0x03 {
// 		// Decompress the public key
// 		pubKey, err := btcec.ParsePubKey(key.PublicKey.Bytes)
// 		if err != nil {
// 			return nil, err
// 		}
// 		pubKeyBytes = pubKey.SerializeUncompressed()
// 	} else {
// 		pubKeyBytes = key.PublicKey.Bytes
// 	}

// 	if len(pubKeyBytes) != 65 {
// 		return nil, errors.New("invalid public key length")
// 	}

// 	pubKey, err := secp256k1.ParsePubKey(pubKeyBytes)
// 	if err != nil {
// 		return nil, errors.New("invalid public key")
// 	}

// 	// Validate the public key
// 	if !pubKey.IsOnCurve() {
// 		return nil, errors.New("public key is not on the curve")
// 	}

// 	return &_ECDSAPublicKey{
// 		PublicKey: pubKey,
// 	}, nil
// }

// func (pk _ECDSAPublicKey) _BytesRaw() []byte {
// 	return pk.PublicKey.SerializeCompressed()
// }

// // https://github.com/hiero-ledger/hiero-sdk-go/blob/7052a2a5cffcf0a6df57336584c50138738ab9b5/sdk/ecdsa_public_key.go#L222
// func VerifySignedMessage(pk _ECDSAPublicKey, message []byte, signature []byte) bool {
// 	if len(signature) != 64 {
// 		return false
// 	}
// 	hash := Keccak256Hash(message)
// 	r := new(big.Int).SetBytes(signature[:32])
// 	s := new(big.Int).SetBytes(signature[32:])

// 	// Verify the signature
// 	return cryptoEcdsa.Verify(pk.PublicKey.ToECDSA(), hash.Bytes(), r, s)
// }

// // https://github.com/hiero-ledger/hiero-sdk-go/blob/main/sdk/crypto.go#L936
// func Keccak256Hash(data []byte) (h Hash) {
// 	hash := sha3.NewLegacyKeccak256()
// 	hash.Write(data)
// 	copy(h[:], hash.Sum(nil))
// 	return h
// }

// // func VerifySignature(publicKeyHex string, message []byte, signature []byte) (bool, error) {
// // 	// publicKey (hex):03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787
// // 	// message (string): hello
// // 	// signature (base64): NsiQSJWWx+SrZK3OsxdbIgNgxch//+RoRk6BZG5gsrJy1NoE7d1OKW/d4/Jo5lu/amkPp8zWzTB4PKTi1BRSZw==

// // 	pubKeyBytes, err := hex.DecodeString(publicKeyHex)
// // 	if err != nil {
// // 		return false, fmt.Errorf("failed to decode public key: %v", err)
// // 	}

// // 	sigBytes, err := base64.StdEncoding.DecodeString(string(signature))
// // 	if err != nil {
// // 		return false, fmt.Errorf("failed to decode signature: %v", err)
// // 	}

// // 	ecdsaPubKey, err := btcec.ParsePubKey(pubKeyBytes, btcec.S256())
// // 	if err != nil {
// // 		return false, fmt.Errorf("failed to parse public key: %v", err)
// // 	}

// // 	hash := sha256.Sum256(message)

// // 	verified := ecdsaPubKey.Verify(hash[:], sigBytes)
// // 	return verified, nil

// // 	return true, nil
// // }
