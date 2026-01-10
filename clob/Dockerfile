# cd prism/clob
# cat ../docker-compose-monolith.yml | grep image:
# export VERSION=0.1.0
# docker build -t ghcr.io/prismmarketlabs/clob:$VERSION .
# docker push ghcr.io/prismmarketlabs/clob:$VERSION
# 
# source loadEnv.sh local
# docker run -p 50051:50051 -e CLOB_HOST=${CLOB_HOST} -e CLOB_PORT=$CLOB_PORT -e CLOB_MATCHING_INTERVAL_SECONDS=$CLOB_MATCHING_INTERVAL_SECONDS -e NATS_HOST=$NATS_HOST -e NATS_PORT=$NATS_PORT ghcr.io/prismmarketlabs/clob:$VERSION

# BUILD stage
FROM rust:latest AS builder

WORKDIR /app/clob

RUN apt-get update
RUN apt-get install -y protobuf-compiler

COPY . /app/clob

RUN cargo build --release

# RUN stage
# A minimal Debian 13 base image for the final stage
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/clob/target/release/clob /app/clob

ENTRYPOINT ["/app/clob"]
