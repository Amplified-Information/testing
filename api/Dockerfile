# BUILD stage
# cd prism
# export VERSION=0.1.0
# docker build -f api/Dockerfile -t ghcr.io/prismmarketlabs/api:$VERSION .
# docker push ghcr.io/prismmarketlabs/api:$VERSION
# 
# source ./api/loadEnv.sh local
# docker run -p 8888:8888 -e API_HOST=$API_HOST -e API_PORT=$API_PORT -e HEDERA_OPERATOR_ID=$HEDERA_OPERATOR_ID -e HEDERA_NETWORK_SELECTED=$HEDERA_NETWORK_SELECTED -e HEDERA_OPERATOR_KEY_TYPE=$HEDERA_OPERATOR_KEY_TYPE -e HEDERA_OPERATOR_KEY=$HEDERA_OPERATOR_KEY -e DB_HOST=$DB_HOST -e DB_PORT=$DB_PORT -e DB_UNAME=$DB_UNAME -e DB_PWORD=$DB_PWORD -e DB_NAME=$DB_NAME -e DB_MAX_ROWS=$DB_MAX_ROWS -e SMART_CONTRACT_ID=$SMART_CONTRACT_ID -e NATS_URL=$NATS_URL -e USDC_ADDRESS=$USDC_ADDRESS -e USDC_DECIMALS=$USDC_DECIMALS -e TIMESTAMP_ALLOWED_FUTURE_SECONDS=$TIMESTAMP_ALLOWED_FUTURE_SECONDS -e TIMESTAMP_ALLOWED_PAST_SECONDS=$TIMESTAMP_ALLOWED_PAST_SECONDS ghcr.io/prismmarketlabs/api:$VERSION

FROM golang:1.25 AS builder

WORKDIR /app/api

# pre-reqs to run the genInterfaces.sh script:
RUN apt-get update
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0
RUN apt-get install -y protobuf-compiler
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.10
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1
RUN go install github.com/envoyproxy/protoc-gen-validate@v1.2.1

# install pg client tools (including pg_dump) to allow for DB debugging, migrations, and seeding:
RUN apt-get install -y ca-certificates curl gnupg
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
RUN CODENAME=$(grep VERSION_CODENAME /etc/os-release | cut -d= -f2)-pgdg && echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $CODENAME main" > /etc/apt/sources.list.d/pgdg.list
RUN apt-get update
RUN apt-get install -y postgresql-client-18

COPY ./api/go.mod ./api/go.sum ./
RUN go mod download

# copy all the API files:
COPY ./api /app/api
# don't forget to copy the clob's proto files and place in /app/clob
COPY ./clob/proto /app/clob/proto

# now generate the interfaces:
RUN sh /app/api/genInterfaces.sh

RUN go build -o main ./server/

# RUN stage
# A minimal Debian 13 base image for the final stage
FROM debian:bookworm-slim

WORKDIR /app

# copy the main binary
COPY --from=builder /app/api/main .

# copy the migrations files to migrate the DB, if needed
COPY --from=builder /app/api/db/migrations .

# copy the seed.sql to seed the initial DB, if needed
COPY --from=builder /app/api/db/seed.sql .

CMD ["./main"]
