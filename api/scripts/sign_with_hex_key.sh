#!/bin/bash

# Your existing variables
PRICE_USD=0.42
N_SHARES=22.2
UTC=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
ACCOUNT_ID="0.0.7090546"
BUYSELL=false

# Your Hedera private key in hex format (replace with your actual key)
PRIVATE_KEY_HEX="1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d"

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

echo "Message to sign: $JSON_MESSAGE"
echo ""

# Convert hex private key to PEM format for OpenSSL
convert_hex_to_pem() {
    local hex_key=$1
    local temp_key_file=$(mktemp)
    
    # Create DER format private key
    {
        # SEQUENCE header for ECDSA private key
        printf '\x30\x74'  # SEQUENCE, length 116
        printf '\x02\x01\x01'  # INTEGER version = 1
        printf '\x04\x20'  # OCTET STRING, length 32 (private key)
        echo -n "$hex_key" | xxd -r -p  # Convert hex to binary
        printf '\xa0\x07'  # Context tag [0], length 7
        printf '\x06\x05\x2b\x81\x04\x00\x0a'  # OID for secp256k1
        printf '\xa1\x44'  # Context tag [1], length 68
        printf '\x03\x42\x00'  # BIT STRING, length 66
        # We'll skip the public key part for simplicity
        printf '\x04'  # Uncompressed point indicator
        # Generate 64 bytes of zeros for public key (not used for signing)
        dd if=/dev/zero bs=1 count=64 2>/dev/null
    } > "${temp_key_file}.der"
    
    # Convert DER to PEM
    openssl ec -inform DER -in "${temp_key_file}.der" -outform PEM -out "${temp_key_file}.pem" 2>/dev/null
    
    echo "$temp_key_file.pem"
}

# Alternative: Use Node.js for signing if available
if command -v node >/dev/null 2>&1; then
    echo "Using Node.js for signing..."
    
    # Create a temporary Node.js script
    cat > /tmp/sign_message.js << 'EOF'
const crypto = require('crypto');

// Get command line arguments
const privateKeyHex = process.argv[2];
const message = process.argv[3];

try {
    // Convert hex private key to buffer
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
    
    // Create private key object
    const privateKey = crypto.createPrivateKey({
        key: privateKeyBuffer,
        format: 'der',
        type: 'sec1'
    });
    
    // Sign the message
    const signature = crypto.sign('sha256', Buffer.from(message), privateKey);
    
    // Convert to base64
    console.log(signature.toString('base64'));
} catch (error) {
    console.error('Signing failed:', error.message);
    process.exit(1);
}
EOF

    # Sign using Node.js
    SIG=$(node /tmp/sign_message.js "$PRIVATE_KEY_HEX" "$JSON_MESSAGE" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$SIG" ]; then
        echo "Signature generated successfully with Node.js"
    else
        echo "Node.js signing failed, trying Python..."
        SIG=""
    fi
    
    # Clean up
    rm -f /tmp/sign_message.js
fi

# Alternative: Use Python if Node.js failed or isn't available
if [ -z "$SIG" ] && command -v python3 >/dev/null 2>&1; then
    echo "Using Python for signing..."
    
    # Check if required Python libraries are available
    python3 -c "import ecdsa, hashlib, base64" 2>/dev/null
    if [ $? -eq 0 ]; then
        # Create a temporary Python script
        cat > /tmp/sign_message.py << 'EOF'
import sys
import ecdsa
import hashlib
import base64

try:
    private_key_hex = sys.argv[1]
    message = sys.argv[2]
    
    # Convert hex private key to integer
    private_key_int = int(private_key_hex, 16)
    
    # Create ECDSA signing key
    signing_key = ecdsa.SigningKey.from_secret_exponent(
        private_key_int, 
        curve=ecdsa.SECP256k1,
        hashfunc=hashlib.sha256
    )
    
    # Sign the message
    signature = signing_key.sign(message.encode('utf-8'))
    
    # Convert to base64
    print(base64.b64encode(signature).decode('utf-8'))
    
except Exception as e:
    print(f"Signing failed: {e}", file=sys.stderr)
    sys.exit(1)
EOF

        # Sign using Python
        SIG=$(python3 /tmp/sign_message.py "$PRIVATE_KEY_HEX" "$JSON_MESSAGE" 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$SIG" ]; then
            echo "Signature generated successfully with Python"
        else
            echo "Python signing failed"
        fi
        
        # Clean up
        rm -f /tmp/sign_message.py
    else
        echo "Python ecdsa library not available. Install with: pip3 install ecdsa"
    fi
fi

# If all else fails, show manual instructions
if [ -z "$SIG" ]; then
    echo "Automatic signing failed. Manual options:"
    echo ""
    echo "1. Install Node.js crypto library or Python ecdsa:"
    echo "   npm install crypto  # (built-in with Node.js)"
    echo "   pip3 install ecdsa"
    echo ""
    echo "2. Or convert your hex key to PEM format manually:"
    echo "   Your hex key: $PRIVATE_KEY_HEX"
    echo "   Message to sign: $JSON_MESSAGE"
    exit 1
fi

# Output the variables you need
echo ""
echo "Generated variables:"
echo "PRICE_USD=$PRICE_USD"
echo "N_SHARES=$N_SHARES"
echo "UTC=\"$UTC\""
echo "ACCOUNT_ID=\"$ACCOUNT_ID\""
echo "BUYSELL=$BUYSELL"
echo "TXID=\"$TXID\""
echo "MARKET_ID=\"$MARKET_ID\""
echo "SIG=\"$SIG\""