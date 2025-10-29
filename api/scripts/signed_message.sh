#!/bin/bash

# Configuration
PRICE_USD=0.42
N_SHARES=22.2
ACCOUNT_ID="0.0.7090546"
BUYSELL=false
PRIVATE_KEY_FILE="private_key.pem"  # Path to your private key file

# Generate UTC timestamp
UTC=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Generate UUIDv7 for txid and marketId
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

echo "Generated values:"
echo "TXID: $TXID"
echo "MARKET_ID: $MARKET_ID"
echo "UTC: $UTC"
echo ""

# Create the JSON message (matching the frontend structure)
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

echo "Message to sign:"
echo "$JSON_MESSAGE" | jq .
echo ""

# Check if private key file exists
if [[ ! -f "$PRIVATE_KEY_FILE" ]]; then
    echo "Private key file '$PRIVATE_KEY_FILE' not found!"
    echo "Please create your private key file or update the PRIVATE_KEY_FILE variable."
    echo ""
    echo "Example: Create a private key file:"
    echo "openssl ecparam -genkey -name secp256k1 -noout -out private_key.pem"
    exit 1
fi

# Sign the message
echo "Signing message..."
SIGNATURE=$(echo -n "$JSON_MESSAGE" | openssl dgst -sha256 -sign "$PRIVATE_KEY_FILE" | base64 -w 0)

echo "Generated signature:"
echo "$SIGNATURE"
echo ""

# Create final JSON with signature
FINAL_JSON=$(jq -n \
    --arg txid "$TXID" \
    --arg marketId "$MARKET_ID" \
    --arg utc "$UTC" \
    --arg accountId "$ACCOUNT_ID" \
    --argjson buySell "$BUYSELL" \
    --argjson priceUsd "$PRICE_USD" \
    --argjson nShares "$N_SHARES" \
    --arg sig "$SIGNATURE" \
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

echo "Final message with signature:"
echo "$FINAL_JSON" | jq .
echo ""

# Save variables for grpcurl
echo "Variables for grpcurl:"
echo "TXID=\"$TXID\""
echo "MARKET_ID=\"$MARKET_ID\""
echo "UTC=\"$UTC\""
echo "ACCOUNT_ID=\"$ACCOUNT_ID\""
echo "BUYSELL=$BUYSELL"
echo "PRICE_USD=$PRICE_USD"
echo "N_SHARES=$N_SHARES"
echo "SIG=\"$SIGNATURE\""
echo ""

# Example grpcurl command
echo "Example grpcurl command:"
echo ""
echo "grpcurl -plaintext -import-path ./proto -proto api.proto -d '$FINAL_JSON' localhost:8888 api.ApiService.PredictIntent"