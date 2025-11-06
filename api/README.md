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
cd api
./genProto.sh



# run the server:
cd api
set -a # automatically export all variables
source ./.config.local
source ./.secrets.local
set +a # turn off auto-export
go run ./server/
```

```bash
# Now do a gRPC call:
PRICE_USD=0.42
N_SHARES=22.2
UTC=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
ACCOUNT_ID=0.0.7090546
BUYSELL=0
SIG=xxxxxxxxxxxxxxxxxxxxx
UUID7=$(printf '%08x-%04x-7%03x-%x%03x-%012x\n' \
  $(( $(date +%s%3N) >> 16 )) \
  $(( $(date +%s%3N) & 0xFFFF )) \
  $(( $(date +%s%3N) & 0x0FFF )) \
  $(( 8 + RANDOM % 4 )) \
  $(( RANDOM & 0x0FFF )) \
  $(( RANDOM<<24 | RANDOM<<12 | RANDOM )) )
```

Create `SIG`:

Ensure openssl and jq are available:

`which openssl jq`

```bash
grpcurl -plaintext -import-path ./proto -proto api.proto -d '{"txid": "'$UUID7'", "marketId": "'$UUID7'", "accountId": "'$ACCOUNT_ID'", "buySell": '$BUYSELL', "sig": "'$SIG'", "priceUsd": '$PRICE_USD', "nShares": '$N_SHARES', "sig": "'$SIG'", "utc": "'$UTC'"}' localhost:8888 api.ApiService.PredictIntent
# notice how the validation takes place!

```

Or...

Grab the JSON.stringified payload from the console.log:

```bash
export PORT=8888
export PAYLOAD='{"txid":"019a2bc2-d729-7407-acb7-fff6e81daa11","marketId":"019a2bc2-d729-7407-acb8-003b2e4fe475","utc":"2025-10-28T16:59:40.713Z","accountId":"0.0.7090546","buySell":"buy","priceUsd":0.5,"nShares":10,"sig":""}'

grpcurl -plaintext -import-path ./proto -proto api.proto -d $PAYLOAD localhost:$PORT api.ApiService.PredictIntent
```

## Database migrations

Use golang-migrate cli tool

`brew install golang-migrate` (Mac)

To install the cli tool on Linux:

```bash
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.19.0/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
migrate -version
```

### new migration

`migrate create -ext sql -dir db/migrations -seq first_table` # sequential numbering (not default date-based)

### migration up

```bash
cd api
set -a # automatically export all variables
source ./.config.local
source ./.secrets.local
set +a # turn off auto-export
DB_URL=postgres://$DB_HOST:$DB_PORT/$DB_NAME
migrate -database $DB_URL -path db/migrations up
```

### migration down

Ty and make your migrations idempotent!

Please test the up/downs in lower envs!

[Best practices](https://github.com/golang-migrate/migrate/blob/master/MIGRATIONS.md)

```bash
cd api
source ./.config.local
source ./.secrets.local
DB_URL=postgres://$DB_HOST:$DB_PORT/$DB_NAME
migrate -database $DB_URL -path db/migrations down
```
