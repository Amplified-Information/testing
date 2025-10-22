A Rust-based CLOB

### Quickstart

`cargo build`

`cargo run`

### commands

**Place an order:**

``` grpcurl
export IS_BUY=true
export PRICE=103
export N=1
export OWNER="0.0.12345"
export TIMESTAMP_NS=$(date +%s%N)
export TX_HASH="0x..."
grpcurl -plaintext -proto ./proto/clob.proto -d '{"owner":"'$OWNER'","is_buy":'$IS_BUY',"price":'$PRICE',"amount":'$N',"timestamp_ns":'$TIMESTAMP_NS',"tx_hash":"'$TX_HASH'"}' localhost:50051 clob.Clob/PlaceOrder
```

**View full orderbook (non-streaming):**

```bash
export DEPTH=5
grpcurl -plaintext -proto ./proto/clob.proto -d '{"depth":'$DEPTH'}' localhost:50051 clob.Clob/GetBook


# or thru the Envoy proxy:
grpcurl -plaintext -proto ./proto/clob.proto -d '{"depth":'$DEPTH'}' localhost:8080 clob.Clob/GetBook
```

**View full orderbook (streaming):**

```bash
export DEPTH=5
grpcurl -plaintext -proto ./proto/clob.proto -d '{"depth":'$DEPTH'}' localhost:50051 clob.Clob/StreamBook
```
