## Quickstart

```bash
# make sure GOPATH is available
echo $GOPATH

# make sure Go version is >1.22
go version

cd api
go mod init api # module name is 'api'
go mod tidy

go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
go install github.com/envoyproxy/protoc-gen-validate@latest
go get google.golang.org/grpc
go get github.com/envoyproxy/protoc-gen-validate@latest
go get github.com/btcsuite/btcd/btcec/v2
go get golang.org/x/crypto/sha3
go get "github.com/decred/dcrd/dcrec/secp256k1/v4"
go get github.com/hiero-ledger/hiero-sdk-go/v2/sdk
# use Envoy’s PGV
mkdir -p proto/validate
curl -sSL https://raw.githubusercontent.com/envoyproxy/protoc-gen-validate/main/validate/validate.proto -o proto/validate/validate.proto

mkdir -p proto/google


# now generate the interface
rm -rf gen && mkdir gen
protoc --proto_path=proto --proto_path=proto/validate --go_out=gen --go_opt=paths=source_relative   --go-grpc_out=gen --go-grpc_opt=paths=source_relative --validate_out="lang=go,paths=source_relative:gen" proto/api.proto


# run the server:
go run ./server/

# Now do a gRPC call:
grpcurl -plaintext -import-path ./proto -proto api.proto -d '{"txid": "00000000-0000-7000-80Bb-0000000000Aa", "accountId": "0.0.7090546", "buySell": false, "sig": "xxxxxxxxxxxxxxx", "price": 14, "sig": "aabbccddeeffgghhiijjkkllmmnn"}' localhost:8888 api.ApiService.PredictIntent
# notice how the validation takes place!


```
