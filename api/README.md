## Quickstart

```bash
# make sure GOPATH is available
echo $GOPATH

# make sure Go version is >1.22
go version

# generate sqlc and protobuf interfaces
cd api
./genInterfaces.sh

# run the server:
cd api
source loadEnv.sh local
go run ./server/
```

**Note:**

There is a [yaak](https://yaak.app/) collection avaiable - see `yaak.json`

## start from scratch

```bash
cd api
go mod init api # module name is 'api'
go mod tidy

# use Envoy’s PGV
mkdir -p proto/validate
curl -sSL https://raw.githubusercontent.com/envoyproxy/protoc-gen-validate/main/validate/validate.proto -o proto/validate/validate.proto

mkdir -p proto/google


# now generate the interface
cd api
./genInterfaces.sh
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
grpcurl -plaintext -import-path ./proto -proto api.proto -d '{"txid": "'$UUID7'", "marketId": "'$UUID7'", "accountId": "'$ACCOUNT_ID'", "buySell": '$BUYSELL', "sig": "'$SIG'", "priceUsd": '$PRICE_USD', "nShares": '$N_SHARES', "sig": "'$SIG'", "generated_at": "'$UTC'"}' localhost:8888 api.ApiService.PredictIntent
# notice how the validation takes place!

```

Or...

Grab the JSON.stringified payload from the console.log:

```bash
export API_PORT=8888
export PAYLOAD='{"txid":"019a2bc2-d729-7407-acb7-fff6e81daa11","marketId":"019a2bc2-d729-7407-acb8-003b2e4fe475","generated_at":"2025-10-28T16:59:40.713Z","accountId":"0.0.7090546","buySell":"buy","priceUsd":0.5,"nShares":10,"sig":""}'

grpcurl -plaintext -import-path ./proto -proto api.proto -d $PAYLOAD localhost:$API_PORT api.ApiService.PredictIntent
```

Retrieve markets from the database:

```bash
export API_PORT=8888

export PAYLOAD="{}"
grpcurl -plaintext -import-path ./proto -proto api.proto -d $PAYLOAD localhost:$API_PORT api.ApiService.GetMarketById

export PAYLOAD='{"market_id":"0189c0a8-7e80-7e80-8000-000000000002"}'
grpcurl -plaintext -import-path ./proto -proto api.proto -d $PAYLOAD localhost:$API_PORT api.ApiService.GetMarketById

export PAYLOAD='{"limit":10,"offset":0}'
grpcurl -plaintext -import-path ./proto -proto api.proto -d $PAYLOAD localhost:$API_PORT api.ApiService.GetMarkets
```

Available networks:

```bash
grpcurl -plaintext -import-path ./proto -proto ./proto/api.proto -d '{}' localhost:8888 api.ApiService/AvailableNetworks
```

Price history:

```bash
grpcurl -plaintext -import-path ./proto -proto ./proto/api.proto -d '{"market_id":"0189c0a8-7e80-7e80-8000-000000000003","net":"testnet","offset":0,"limit":1000,"resolution":"minute","from":"2025-12-30T10:00:00Z","to":"2025-12-30T17:55:00Z"}' localhost:8888 api.ApiService/PriceHistory
```

Get comments:
```bash
grpcurl -plaintext -import-path ./proto -proto ./proto/api.proto -d '{"market_id":"0189c0a8-7e80-7e80-8000-000000000003","offset":0,"limit":1000}' localhost:8888 api.ApiService/GetComments
```

Add a comment:
```bash
grpcurl -plaintext -import-path ./proto -proto ./proto/api.proto -d '{"market_id":"0189c0a8-7e80-7e80-8000-000000000003","accountId":"0.0.1234","content":"Hello, world","sig":"some_sig_here","publicKey":"public_key_here","keyType":1}' localhost:8888 api.ApiService/CreateComment
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
source ./loadEnv.sh local
DB_URL=postgres://$DB_UNAME:$DB_PWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable
echo $DB_URL
migrate -database $DB_URL -path db/migrations up
```

### migration down

Ty and make your migrations idempotent!

Please test the up/downs in lower envs!

[Best practices](https://github.com/golang-migrate/migrate/blob/master/MIGRATIONS.md)

```bash
cd api

source ./loadEnv.sh local
DB_URL=postgres://$DB_UNAME:$DB_PWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable
echo $DB_URL
migrate -database $DB_URL -path db/migrations down
```

## sqlc

`go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`

`sqlc version`

N.B. maintain a database schema:

```bash
cd api
pg_dump $DB_URL --schema-only | sed '/^\\/d' > ./db/schema.sql
```

Can now do:

```bash
cd api/db
sqlc generate
```

### seed the database

Add test data to `seed.sql`

Run:

```bash
cd api
source loadEnv.sh local
DB_URL=postgres://$DB_UNAME:$DB_PWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable

cd api/db
psql $DB_URL -f seed.sql
```

N.B. Do NOT run on prod!
