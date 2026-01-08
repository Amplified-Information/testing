package services

import (
	pb_api "api/gen"
	"api/server/lib"
	"fmt"
	"os"
	"strings"

	hiero "github.com/hiero-ledger/hiero-sdk-go/v2/sdk"
)

type PositionsService struct {
	// dbRepository *repositories.DbRepository
}

func (p *PositionsService) Init() error {
	// and inject the DbService:
	// p.dbRepository = d

	return nil
}

func (p *PositionsService) GetUserPosition(req *pb_api.UserPositionRequest) (*pb_api.UserPositionResponse, error) {
	marketIdBig, err := lib.Uuid7_to_bigint(req.MarketId)
	if err != nil {
		return nil, fmt.Errorf("failed to convert marketId to bigint: %w", err)
	}

	contractID, err := hiero.ContractIDFromString(
		os.Getenv(fmt.Sprintf("%s_SMART_CONTRACT_ID", strings.ToUpper(req.Net))),
	)
	if err != nil {
		return nil, fmt.Errorf("invalid contract ID: %v", err)
	}

	// call smart contract here...
	params := hiero.NewContractFunctionParameters()
	params.AddUint128BigInt(marketIdBig)
	params.AddAddress(req.EvmAddress)

	// JavaScript function to call:
	// const query = new ContractCallQuery()
	//     .setContractId(ContractId.fromString(contractId))
	//     .setGas(100_000)
	//     .setFunction(
	//       'getUserTokens',
	//       params
	//     )

	// Golang equivalent:
	query := hiero.NewContractCallQuery().
		SetContractID(contractID).
		SetGas(100_000).
		SetFunction("getUserTokens", params)

	return &pb_api.UserPositionResponse{
		Yes: 0,
		No:  0,
	}, nil
}
