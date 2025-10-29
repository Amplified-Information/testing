#!/bin/bash

# Your existing variables
PRICE_USD=0.42
N_SHARES=22.2
UTC=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
ACCOUNT_ID="0.0.7090546"
BUYSELL=0

# Generate UUIDv7 for required fields
generate_uuidv7() {
    local timestamp_ms=$(date +%s%3N)
    printf '%08x-%04x-7%03x-%x%03x-%012x\n' \
        $(( timestamp_ms >> 16 )) \
        $(( timestamp_ms & 0xFFFF )) \
        $(( timestamp_ms & 0x0FFF )) \
        $(( 8 + RANDOM % 4 )) \
        $(( RANDOM & 0x0FFF )) \
        $(( RANDOM<<24 | RANDOM<<12 | RANDOM ))
}

TXID=$(generate_uuidv7)
MARKET_ID=$(generate_uuidv7)

# Create JSON message with empty signature
JSON_MESSAGE=$(jq -n \
    --arg txid "$TXID" \
    --arg marketId "$MARKET_ID" \
    --arg utc "$UTC" \
    --arg accountId "$ACCOUNT_ID" \
    --argjson buySell "$BUYSELL" \
    --argjson priceUsd "$PRICE_USD" \
    --argjson nShares "$N_SHARES" \
    --arg sig "" \
    '{
        txid: $txid,
        marketId: $marketId,
        utc: $utc,
        accountId: $accountId,
        buySell: $buySell,
        priceUsd: $priceUsd,
        nShares: $nShares,
        sig: $sig
    }')

# Sign the message (replace 'private_key.pem' with your actual private key file)
SIG=$(echo -n "$JSON_MESSAGE" | openssl dgst -sha256 -sign private_key.pem | base64 -w 0)

# Output the variables you need
echo "PRICE_USD=$PRICE_USD"
echo "N_SHARES=$N_SHARES"
echo "UTC=\"$UTC\""
echo "ACCOUNT_ID=\"$ACCOUNT_ID\""
echo "BUYSELL=$BUYSELL"
echo "TXID=\"$TXID\""
echo "MARKET_ID=\"$MARKET_ID\""
echo "SIG=\"$SIG\""