package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math"

	"os"

	"api/server/lib"

	pb_clob "api/gen/clob"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type HederaService struct {
	hedera_client *hiero.Client
}

type PublicKey struct {
	KeyType string
	Key     string
}

func (h *HederaService) InitHedera() (*hiero.Client, error) {
	networkSelected := os.Getenv("HEDERA_NETWORK_SELECTED")
	operatorIdStr := os.Getenv("HEDERA_OPERATOR_ID")
	operatorKeyStr := os.Getenv("HEDERA_OPERATOR_KEY")

	operatorId, err := hiero.AccountIDFromString(operatorIdStr)
	if err != nil {
		return nil, fmt.Errorf("invalid HEDERA_OPERATOR_ID: %v", err)
	}

	operatorKey, err := hiero.PrivateKeyFromStringECDSA(operatorKeyStr)
	if err != nil {
		return nil, fmt.Errorf("invalid HEDERA_OPERATOR_KEY: %v", err)
	}

	client, err := hiero.ClientForName(networkSelected)
	if err != nil {
		return nil, fmt.Errorf("failed to create Hedera client: %v", err)
	}

	client.SetOperator(operatorId, operatorKey)

	h.hedera_client = client
	log.Println("Hedera initialized successfully")
	return client, nil
}

func (h *HederaService) VerifySignature(pubKeyHex string, messageUTF8 string, sigBase64 string) (bool, error) {
	// _pubKeyHex := "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
	// **works**
	// _messageUTF8 := "aGVsbG8=" // hello
	// _sigBase64 := "2e//YBNUI73pfAnY3Eoh+sAGV8naXuCjfj8+JjByVGFwckhE2ICgs9YYoapxVuR2Qnq+4yxheLSSfa4TXObT+A=="
	// **works**
	// _sigBase64 := "NsiQSJWWx+SrZK3OsxdbIgNgxch//+RoRk6BZG5gsrJy1NoE7d1OKW/d4/Jo5lu/amkPp8zWzTB4PKTi1BRSZw==" // hello
	// **works**
	// _messageUTF8 := "{\"txid\":\"019a2c12-633b-75e7-8004-4585f525048c\",\"marketId\":\"019a2c12-633b-75e7-8004-4839f51ba5eb\",\"generated_at\":\"2025-10-28T18:26:33.915Z\",\"accountId\":\"0.0.7090546\",\"buySell\":\"buy\",\"priceUsd\":0,\"nShares\":0}"
	// _sigBase64 := "0Kq5/wcUzqFXggdx/LkJpP1JbwGudaNdNN7wbIRZoyU1QO7bPVCKyJTuBSxfF8SSgyu0aMhTi2n8E6kD7vizEw=="
	// **works**
	// _messageUTF8 := "{\"txid\":\"019a2c4d-890b-759c-816e-d5e88ed59168\",\"marketId\":\"019a2c4d-890b-759c-816e-da2f5739d388\",\"generated_at\":\"2025-10-28T19:31:10.219Z\",\"accountId\":\"0.0.7090546\",\"buySell\":\"buy\",\"priceUsd\":0.5,\"nShares\":2}"
	// _sigBase64 := "Fhs1PJ1bCji5jS951CT43Mu9q5Y1YLVBTgFsSKkG0Ap9ocmb6O9RsEIpn4QVan5X38tHovj+9P5GmIUh5SVwWw=="

	log.Printf("VerifyHashPackSignature: \n- pubKeyHex: %s\n- messageUTF8: %s\n- sigBase64: %s\n", pubKeyHex, messageUTF8, sigBase64)

	isSigValid, err := h.VerifyHashPackSignature(pubKeyHex, messageUTF8, sigBase64)
	if err != nil {
		return false, err
	}

	return isSigValid, nil
}

// VerifyHashPackSignature verifies a HashPack signature for a given message and ECDSA public key
// pubKeyHex: compressed Hedera ECDSA public key (33 bytes, hex string)
// messageUTF8: the original message that was signed
// sigBase64: the Base64 R||S signature from HashPack
func (h *HederaService) VerifyHashPackSignature(pubKeyHex string, messageUTF8 string, sigBase64 string) (bool, error) {
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
	prefixed := []byte(fmt.Sprintf("\x19Hedera Signed Message:\n%d%s", len(messageUTF8), messageUTF8))

	// Verify signature
	verified := pubKey.VerifySignedMessage(prefixed, sigBytes)
	return verified, nil
}

func (h *HederaService) GetPublicKey(accountId hiero.AccountID) (PublicKey, error) {
	// TODO... may get rate limited here...
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s", os.Getenv("HEDERA_NETWORK_SELECTED"), accountId)
	resp, err := lib.Fetch(lib.GET, mirrorNodeURL, nil)

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

func (h *HederaService) GetSpenderAllowanceUsd(networkSelected hiero.LedgerID, accountId hiero.AccountID, smartContractId hiero.ContractID, usdcAddress hiero.ContractID, usdcDecimals uint64) (float64, error) {
	mirrorNodeURL := fmt.Sprintf("https://%s.mirrornode.hedera.com/api/v1/accounts/%s/allowances/tokens?spender.id=eq:%s&token.id=eq:%s", networkSelected.String(), accountId.String(), smartContractId.String(), usdcAddress.String())

	resp, err := lib.Fetch(lib.GET, mirrorNodeURL, nil)
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
	amount := float64(result.Allowances[0].Amount) / math.Pow(10, float64(usdcDecimals))
	return amount, nil
}

func (h *HederaService) GetEvmAlias(accountId hiero.AccountID) (string, error) {
	info, err := hiero.NewAccountInfoQuery().
		SetAccountID(accountId).
		Execute(h.hedera_client)
	if err != nil {
		return "", fmt.Errorf("GetEvmAlias failed: %w", err)
	}

	return info.ContractAccountID, nil
}

func (h *HederaService) BuyPositionTokens(orderRequestClob *pb_clob.OrderRequestClob) error {
	// amount := orderRequestClob.PriceUsd * orderRequestClob.NShares

	// implement smart contract interaction to buy shares
	// call function buyPositionTokensOnBehalf(address buyer, uint256 amount) external { ... }
	// Create contract function call
	smartContractIdStr := os.Getenv("SMART_CONTRACT_ID")
	smartContractId, err := hiero.ContractIDFromString(smartContractIdStr)
	if err != nil {
		return fmt.Errorf("invalid SMART_CONTRACT_ID: %w", err)
	}

	accountId, err := hiero.AccountIDFromString(orderRequestClob.AccountId)
	if err != nil {
		return fmt.Errorf("BuyPositionTokens: invalid AccountId: %w", err)
	}

	// look up the alias key for accountId for EVM execution:
	evmAlias, err := h.GetEvmAlias(accountId)
	if err != nil {
		return fmt.Errorf("failed to get alias key: %v", err)
	}

	params := hiero.NewContractFunctionParameters()
	params.AddAddress(evmAlias) // accountId.ToEvmAddress()) // h.hedera_client.GetOperatorPublicKey().ToEvmAddress()) //accountId.ToEvmAddress())
	params.AddUint256(lib.Int64ToBytes(int64(orderRequestClob.PriceUsd * orderRequestClob.Qty)))

	contractCall := hiero.NewContractExecuteTransaction().
		SetContractID(smartContractId).
		SetGas(1_000_000). // paid by us...
		SetFunction("buyPositionTokensOnBehalf", params)

	// Execute transaction
	txResponse, err := contractCall.Execute(h.hedera_client)
	if err != nil {
		return fmt.Errorf("failed to execute contract call: %w", err)
		// TODO - put the order back on the CLOB...
	}

	// Get receipt
	receipt, err := txResponse.GetReceipt(h.hedera_client)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %w", err)
		// TODO - put the order back on the CLOB...
	}

	if receipt.Status != hiero.StatusSuccess {
		return fmt.Errorf("contract execution failed with status: %s", receipt.Status)
		// TODO - put the order back on the CLOB...
	}

	log.Printf("Successfully bought %d position tokens for txId=%s. Hedera tx ID: %s", orderRequestClob.Qty, orderRequestClob.TxId, txResponse.TransactionID.String())
	return nil
}
