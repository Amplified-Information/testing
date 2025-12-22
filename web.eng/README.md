# web

A web app for prediction market

## Quickstart

```bash
npm i

npm run gen

npm run dev
```

### web on local (Docker):

```bash
# follow instructions at:
head Dockerfile
```

## Generate TypeScript interfaces

Interface is gRPC.

Using [grpc-web](https://github.com/grpc/grpc-web/) on the frontend.

`sudo apt-get install protobuf-compiler`

`protoc --version` # should be >= 3

Followed this guide: https://dev.to/arichy/using-grpc-in-react-the-modern-way-from-grpc-web-to-connect-41lc (`protobuf-ts`)

```bash
npm i --save @protobuf-ts/grpcweb-transport # "gRPC runtime library"
npm i --save-dev @protobuf-ts/plugin # "protoc compiler plugin, used to compile proto files into TS code"
```

Generate:

`npm run gen`

See: `grpcClient.ts`

## OLD


```bash
cd ./web
mkdir proto

npm i --save-dev @bufbuild/protoc-gen-es

protoc \
  -I=../clob/proto \
  --plugin=protoc-gen-es=./node_modules/.bin/protoc-gen-es \
  --es_out=./proto \
  ../clob/proto/clob.proto
```



This doesn't generate very well for modern TS web apps...

Also, the deps have vulnerabilities...

```bash
npm i --save-dev protoc-gen-js
npm i --save-dev protoc-gen-grpc-web

protoc \
  -I=../clob/proto \
  --plugin=protoc-gen-grpc-web=./node_modules/.bin/protoc-gen-grpc-web \
  ../clob/proto/clob.proto \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:./proto

# (optional: with JS output...)
protoc \
  -I=../clob/proto \
  --plugin=protoc-gen-js=./node_modules/.bin/protoc-gen-js \
  --plugin=protoc-gen-grpc-web=./node_modules/.bin/protoc-gen-grpc-web \
  ../clob/proto/clob.proto \
  --js_out=import_style=es6:./proto \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:./proto
```