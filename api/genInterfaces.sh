#!/bin/bash

rm -rf gen
mkdir -p gen/clob

echo "Generating sqlc interfaces..."
cd db
sqlc generate
cd ..
echo "-> sqlc interfaces generated."
echo ""

#protoc --proto_path=proto --proto_path=proto/validate --go_out=gen --go_opt=paths=source_relative --go-grpc_out=gen --go-grpc_opt=paths=source_relative --validate_out="lang=go,paths=source_relative:gen" proto/api.proto
protoc \
  --proto_path=./proto \
  --proto_path=/usr/include \
  --proto_path=proto/validate \
  --go_out=gen --go_opt=paths=source_relative \
  --go-grpc_out=gen --go-grpc_opt=paths=source_relative \
  --validate_out="lang=go,paths=source_relative:gen" \
  ./proto/api.proto

protoc \
  --proto_path=../clob/proto \
  --proto_path=/usr/include \
  --go_out=gen/clob --go_opt=paths=source_relative --go_opt=Mclob.proto=./gen/clob \
  --go-grpc_out=gen/clob --go-grpc_opt=paths=source_relative --go-grpc_opt=Mclob.proto=./gen/clob \
  --validate_out="lang=go,paths=source_relative:gen/clob" \
  ../clob/proto/clob.proto

echo "Done."
echo -e "Protobufs generated in gen:\n"
ls -al gen/
