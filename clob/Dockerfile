# BUILD stage
# docker build -f clob/Dockerfile -t ghcr.io/prismmarketlabs/clob:VERSION .
FROM rust:latest AS builder

WORKDIR /app/clob

RUN apt-get update
RUN apt-get install -y protobuf-compiler

COPY ./clob /app/clob

RUN cargo build --release

# RUN stage
# docker run --env-file ./clob/.config.local --env-file ./clob/.secrets.local ghcr.io/prismmarketlabs/clob:VERSION
# A minimal Debian 13 base image for the final stage
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/clob/target/release/clob /app/clob

ENTRYPOINT ["/app/clob"]