#!/bin/bash

rm -rf gen
mkdir -p gen


#protoc --proto_path=proto --proto_path=proto/validate --go_out=gen --go_opt=paths=source_relative --go-grpc_out=gen --go-grpc_opt=paths=source_relative --validate_out="lang=go,paths=source_relative:gen" proto/api.proto
protoc \
  --proto_path=proto \
  --proto_path=/usr/include \
  --proto_path=proto/validate \
  --go_out=gen --go_opt=paths=source_relative \
  --go-grpc_out=gen --go-grpc_opt=paths=source_relative \
  --validate_out="lang=go,paths=source_relative:gen" \
  proto/api.proto