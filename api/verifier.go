// sign_and_verify.go
package main

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"

	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	ecdsa_decred "github.com/decred/dcrd/dcrec/secp256k1/v4/ecdsa"
)

// HederaVerifyECDSA: same verifier as before, strict checks matching Hedera 0x167 precompile.
func HederaVerifyECDSA(messageHash []byte, pubKeyBytes []byte, sig []byte) (bool, error) {
	if len(messageHash) != 32 {
		return false, errors.New("message hash must be 32 bytes")
	}
	if len(sig) != 64 {
		return false, errors.New("signature must be 64 bytes (r||s)")
	}

	// Ensure signature length is valid before parsing r and s
	if len(sig) != 64 {
		panic(fmt.Sprintf("Invalid signature length: expected 64 bytes, got %d", len(sig)))
	}

	// parse r and s
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:64])

	curve := secp256k1.S256()
	one := big.NewInt(1)
	if r.Cmp(one) < 0 || r.Cmp(curve.Params().N) >= 0 {
		return false, errors.New("invalid r")
	}
	if s.Cmp(one) < 0 || s.Cmp(curve.Params().N) >= 0 {
		return false, errors.New("invalid s")
	}

	pubKey, err := secp256k1.ParsePubKey(pubKeyBytes)
	if err != nil {
		return false, fmt.Errorf("failed to parse public key: %w", err)
	}

	ecdsaPub := ecdsa.PublicKey{
		Curve: curve,
		X:     pubKey.X(),
		Y:     pubKey.Y(),
	}

	ok := ecdsa.Verify(&ecdsaPub, messageHash, r, s)
	return ok, nil
}

func main() {
	// Deterministic private key (canonical test seed)
	privHex := "4c0883a69102937d6231471b5dbb6204fe51296170827912a0d44b47c7f9f409"
	privBytes, err := hex.DecodeString(privHex)
	if err != nil {
		panic(err)
	}

	// Load private key into Decred secp256k1
	privKey := secp256k1.PrivKeyFromBytes(privBytes)

	// Public keys
	pub := privKey.PubKey()
	uncompressed := append([]byte{0x04}, append(pub.X().Bytes(), pub.Y().Bytes()...)...)
	compressed := pub.SerializeCompressed()

	// Message to sign
	message := []byte("hello hedera")
	// Hedera/HashPack expects the caller to provide the final 32-byte hash.
	msgHash := sha256.Sum256(message)

	// RFC6979 deterministic signing using Decred ecdsa (this implementation uses RFC6979)
	// ecdsa_decred.Sign returns a *ecdsa.DecredSignature (r,s), deterministic per RFC6979.
	signature := ecdsa_decred.Sign(privKey, msgHash[:])

	// signature R and S as big-endian fixed 32-byte fields
	r := signature.R() // Store the value in a variable
	s := signature.S() // Store the value in a variable

	rb := r.Bytes() // Call Bytes() on the variable
	sb := s.Bytes() // Call Bytes() on the variable

	// left-pad to 32 bytes each
	rbytes := make([]byte, 32)
	sbytes := make([]byte, 32)
	copy(rbytes[32-len(rb):], rb)
	copy(sbytes[32-len(sb):], sb)

	sig64 := append(rbytes, sbytes...)

	// Print everything
	fmt.Println("Private key (hex):", privHex)
	fmt.Println("Public key (uncompressed hex):", hex.EncodeToString(uncompressed))
	fmt.Println("Public key (compressed hex)  : ", hex.EncodeToString(compressed))
	fmt.Printf("Message (UTF-8)             : %s\n", string(message))
	fmt.Println("Message hash (SHA-256)      : ", hex.EncodeToString(msgHash[:]))
	fmt.Println("r (hex)                     : ", hex.EncodeToString(rbytes))
	fmt.Println("s (hex)                     : ", hex.EncodeToString(sbytes))
	fmt.Println("signature (64 bytes r||s)   : ", hex.EncodeToString(sig64))

	// Verify locally using Hedera-style verifier
	ok, vErr := HederaVerifyECDSA(msgHash[:], uncompressed, sig64)
	fmt.Println("Hedera-style verification result:", ok, "error:", vErr)
}
