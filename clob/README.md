# CLOB

A Rust-based CLOB

```text
BIDS (Buy Orders - Highest Price First):
Price: 0.52 → Queue: [Order1, Order2, Order3]  ← Best Bid
Price: 0.51 → Queue: [Order4]
Price: 0.50 → Queue: [Order5, Order6]

ASKS (Sell Orders - Lowest Price First):  
Price: -0.48 → Queue: [Order7, Order8]      ← Best Ask (closest to 0)
Price: -0.49 → Queue: [Order9]
Price: -0.50 → Queue: [Order10, Order11]
```

## State Representation

The OrderBook state looks like this:

**Key Properties**

- Price-Time Priority: Orders at the same price level are served FIFO via VecDeque
- Efficient Lookup: BTreeMap provides O(log n) price level access
- Automatic Sorting: Best bid/ask prices are efficiently accessible
- Signed Price System: Positive = buy, negative = sell (unique approach)
- Memory Efficient: Empty price levels are cleaned up via cleanup_empty_levels()

**State Access Methods**

- best_bid_mut(): Gets highest positive price (best buy order)
- best_ask_mut(): Gets highest negative price (best sell order, closest to 0)
- snapshot_top(depth): Returns top N price levels for each side
- Orders within each price level maintain strict time priority (FIFO)

This format enables efficient matching, maintains market integrity with price-time priority, and provides fast access to the best available prices on both sides of the book.

### Quickstart

`cargo build`

`cargo run`

### commands

**Place an order:**

```bash
export OWNER="0.0.12345"
export PRICE_USD=0.5000005
export MARKET_LIMIT=limit
export QTY=1.5
UUID7=$(printf '%08x-%04x-7%03x-%x%03x-%012x\n' \
  $(( $(date +%s%3N) >> 16 )) \
  $(( $(date +%s%3N) & 0xFFFF )) \
  $(( $(date +%s%3N) & 0x0FFF )) \
  $(( 8 + RANDOM % 4 )) \
  $(( RANDOM & 0x0FFF )) \
  $(( RANDOM<<24 | RANDOM<<12 | RANDOM )) )

grpcurl -plaintext -proto ./proto/clob.proto -d '{"txId":"'$UUID7'","marketId":"'$UUID7'","accountId":"'$OWNER'","marketLimit":"'$MARKET_LIMIT'","priceUsd":'$PRICE_USD',"qty":'$QTY'}' localhost:50051 clob.Clob/PlaceOrder
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
