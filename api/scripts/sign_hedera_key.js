#!/usr/bin/env node

const crypto = require('crypto');

// Your configuration
const PRICE_USD = 0.42;
const N_SHARES = 22.2;
const ACCOUNT_ID = "0.0.7090546";
const BUYSELL = false;

// Your Hedera private key in hex format
const PRIVATE_KEY_HEX = "1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d";

// Generate UTC timestamp
const UTC = new Date().toISOString();

// Generate UUIDv7
function generateUUIDv7() {
    const timestamp = BigInt(Date.now());
    const randomA = crypto.randomInt(0, 0x0FFF);
    const randomB = crypto.randomInt(0x8000, 0xBFFF); // Ensure version bits
    const randomC = crypto.randomBytes(6);
    
    return [
        (timestamp >> 16n).toString(16).padStart(8, '0'),
        (timestamp & 0xFFFFn).toString(16).padStart(4, '0'),
        '7' + randomA.toString(16).padStart(3, '0'),
        randomB.toString(16).padStart(4, '0'),
        randomC.toString('hex')
    ].join('-');
}

const TXID = generateUUIDv7();
const MARKET_ID = generateUUIDv7();

// Create the message object (with empty signature)
const messageObj = {
    txid: TXID,
    marketId: MARKET_ID,
    utc: UTC,
    accountId: ACCOUNT_ID,
    buySell: BUYSELL,
    priceUsd: PRICE_USD,
    nShares: N_SHARES,
    sig: ""
};

// Convert to JSON string
const jsonMessage = JSON.stringify(messageObj);

console.log("Message to sign:");
console.log(JSON.stringify(messageObj, null, 2));
console.log();

try {
    // Convert hex private key to buffer (32 bytes for secp256k1)
    const privateKeyBuffer = Buffer.from(PRIVATE_KEY_HEX, 'hex');
    
    // Create ECDSA private key in the format Node.js expects
    // This is a bit tricky - we need to create a proper ASN.1 DER structure
    const derKey = Buffer.concat([
        Buffer.from([0x30, 0x74]), // SEQUENCE, length
        Buffer.from([0x02, 0x01, 0x01]), // INTEGER version = 1
        Buffer.from([0x04, 0x20]), // OCTET STRING, length 32
        privateKeyBuffer, // 32-byte private key
        Buffer.from([0xa0, 0x07]), // Context [0], length 7
        Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a]), // OID secp256k1
        Buffer.from([0xa1, 0x44]), // Context [1], length 68  
        Buffer.from([0x03, 0x42, 0x00]), // BIT STRING, length 66
        Buffer.alloc(65, 0) // 65 bytes for public key (we don't need it for signing)
    ]);
    
    // Create private key object
    const privateKey = crypto.createPrivateKey({
        key: derKey,
        format: 'der',
        type: 'sec1'
    });
    
    // Sign the message
    const signature = crypto.sign('sha256', Buffer.from(jsonMessage), privateKey);
    const signatureBase64 = signature.toString('base64');
    
    console.log("Generated signature:");
    console.log(signatureBase64);
    console.log();
    
    // Output variables
    console.log("Variables:");
    console.log(`PRICE_USD=${PRICE_USD}`);
    console.log(`N_SHARES=${N_SHARES}`);
    console.log(`UTC="${UTC}"`);
    console.log(`ACCOUNT_ID="${ACCOUNT_ID}"`);
    console.log(`BUYSELL=${BUYSELL}`);
    console.log(`TXID="${TXID}"`);
    console.log(`MARKET_ID="${MARKET_ID}"`);
    console.log(`SIG="${signatureBase64}"`);
    
} catch (error) {
    console.error('Signing failed:', error.message);
    console.log('\nTrying alternative approach with secp256k1 library...');
    console.log('Install it with: npm install secp256k1');
    process.exit(1);
}