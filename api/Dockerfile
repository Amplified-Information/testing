# BUILD stage
# cd prism
# docker build -f api/Dockerfile -t ghcr.io/prismmarketlabs/api:VERSION .
FROM golang:1.25 AS builder

WORKDIR /app/api

# pre-reqs to run the genInterfaces.sh script:
RUN apt-get update
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0
RUN apt-get install -y protobuf-compiler
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.10
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1
RUN go install github.com/envoyproxy/protoc-gen-validate@v1.2.1

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
# docker run --env-file ./api/.config.local --env-file ./api/.secrets.local ghcr.io/prismmarketlabs/api:VERSION
# A minimal Debian 13 base image for the final stage
FROM debian:bookworm-slim

WORKDIR /app

ENV HOST=${HOST} \
  PORT=${PORT} \
  HEDERA_OPERATOR_ID=${HEDERA_OPERATOR_ID} \
  HEDERA_OPERATOR_KEY_TYPE=${HEDERA_OPERATOR_KEY_TYPE} \
  DB_HOST=${DB_HOST} \
  DB_PORT=${DB_PORT} \
  DB_UNAME=${DB_UNAME} \
  DB_NAME=${DB_NAME} \
  DB_MAX_ROWS=${DB_MAX_ROWS} \
  \
  HEDERA_OPERATOR_KEY=${HEDERA_OPERATOR_KEY} \
  DB_PWORD=${DB_PWORD}

COPY --from=builder /app/api/main .

EXPOSE 8888

CMD ["./main"]
