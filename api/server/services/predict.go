package services

import (
	"fmt"
	"log"

	pb "api/gen"
	"api/server/lib"
)

func SubmitPredictionIntent(req *pb.PredictionIntentRequest) (string, error) {
	// 1. validate the key
	accountId := req.AccountId

	// Look up the Hedera accountId against the mirror node
	keyObj, err := lib.GetPublicKey(accountId)
	if err != nil {
		return "", fmt.Errorf("failed to get public key: %v", err)
	}

	// validate the signature
	
	log.Printf("Mirror node response for account %s: %s %s", accountId, keyObj.Key, keyObj.KeyType)

	// Optionally, parse the response body if needed
	// body, err := io.ReadAll(resp.Body)
	// if err != nil {
	//     return "", fmt.Errorf("failed to read mirror node response: %v", err)
	// }
	//

	// 2. put the order on the CLOB
	return fmt.Sprintf("Processed input for user %s", req.AccountId), nil
}
