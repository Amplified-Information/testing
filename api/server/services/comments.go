package services

import (
	pb_api "api/gen"
	"api/server/lib"
	repositories "api/server/repositories"
	"fmt"
	"log"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type CommentsService struct {
	dbRepository *repositories.DbRepository
}

func (c *CommentsService) Init(d *repositories.DbRepository) error {
	// and inject the DbService:
	c.dbRepository = d

	log.Printf("Comments service initialized successfully")
	return nil
}

func (c *CommentsService) GetComments(req *pb_api.GetCommentsRequest) (*pb_api.GetCommentsResponse, error) {
	response, err := c.dbRepository.GetCommentsByMarketId(req.MarketId, *req.Limit, *req.Offset)
	if err != nil {
		return nil, err
	}

	var comments []*pb_api.Comment
	for _, row := range response.Comments {
		commentResponse := &pb_api.Comment{
			AccountId: row.AccountId,
			Content:   row.Content,
			Sig:       row.Sig,
			PublicKey: row.PublicKey,
			KeyType:   uint32(row.KeyType),
		}
		comments = append(comments, commentResponse)
	}

	returnObj := &pb_api.GetCommentsResponse{
		Comments: comments,
	}
	return returnObj, nil
}

func (c *CommentsService) CreateComment(req *pb_api.CreateCommentRequest) (*pb_api.CreateCommentResponse, error) {

	/*
		accountId: "0.0.7090546"
		content: "Hello again"
		keyType: 2
		marketId: "0189c0a8-7e80-7e80-8000-000000000003"
		publicKey: "03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
		sig: "oiAUmuO8egKEMD+gbrxBjsxpVCZjl2Tec/GEN1m1hptubn2poBQ+k1tOEL9GR9npKot5+hPlJSzaWn3ysmpRYA=="
	*/

	// guards

	// ensure content is not empty and gt 1 char
	if len(req.Content) < 1 {
		return nil, fmt.Errorf("comment content is too short")
	}
	// ensure content is not too long
	if len(req.Content) > 1000 {
		return nil, fmt.Errorf("comment content is too long (max 1000 chars)")
	}

	// ensure sig length is reasonable
	if len(req.Sig) < 16 {
		return nil, fmt.Errorf("signature is too short")
	}

	// ensure key type is supported
	if lib.IsValidKeyType(req.KeyType) == false {
		return nil, fmt.Errorf("unsupported key type: %d", req.KeyType)
	}

	// ensure account ID is valid
	if lib.IsValidAccountId(req.AccountId) == false {
		return nil, fmt.Errorf("invalid account ID: %s", req.AccountId)
	}

	// ensure public key is valid
	publicKey, err := hiero.PublicKeyFromString(req.PublicKey)
	if err != nil {
		return nil, fmt.Errorf("Invalid public key format: %v", err)
	}

	// now verify signature
	isValidSig, err := lib.VerifySig(&publicKey, lib.Utf82hex(req.Content), req.Sig)
	if err != nil {
		log.Printf("Failed to verify signature: %v", err)
		return nil, fmt.Errorf("failed to verify signature: %v", err)
	}
	if !isValidSig {
		log.Printf("Invalid signature for account %s", req.AccountId)
		return nil, fmt.Errorf("invalid signature")
	}
	// if we get here, the sig is valid
	log.Printf("**CreateComment - sig is valid for account %s**", req.AccountId)

	// TODO - AI moderation (e.g. Gemini)
	// Moderate the content using AI moderation (e.g., Gemini)

	/////
	// OK
	/////
	row, err := c.dbRepository.CreateComment(req.MarketId, req.AccountId, req.Content, req.Sig, req.PublicKey, req.KeyType)
	if err != nil {
		return nil, err
	}

	commentResponse := &pb_api.Comment{
		AccountId: row.AccountID,
		Content:   row.Content,
		Sig:       req.Sig,
		PublicKey: req.PublicKey,
		KeyType:   req.KeyType,
		CreatedAt: row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	response := &pb_api.CreateCommentResponse{
		Comment: commentResponse,
	}
	return response, nil
}
