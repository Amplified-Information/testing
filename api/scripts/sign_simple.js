#!/usr/bin/env node

// Simple signing script for Hedera private keys
// Install dependencies: npm install secp256k1

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const secretsPath = path.join(__dirname, '..', '.secrets.local');
const secretsContent = fs.readFileSync(secretsPath, 'utf8');
const HEDERA_OPERATOR_KEY = secretsContent.match(/HEDERA_OPERATOR_KEY=(.+)/)[1].trim();

// Check if secp256k1 is available
let secp256k1;
try {
    secp256k1 = require('secp256k1');
} catch (e) {
    console.log('secp256k1 library not found. Install with: npm install secp256k1');
    console.log('Trying with built-in crypto...\n');
}

// Configuration
const PRICE_USD = 0.42;
const N_SHARES = 22.2;
const ACCOUNT_ID = "0.0.7090546";
const BUYSELL = "buy";

// Generate UTC timestamp
const UTC = new Date().toISOString();

// Generate UUIDv7 according to RFC 9562
function generateUUIDv7() {
    const timestamp = Date.now();
    
    // 48-bit timestamp (milliseconds since Unix epoch)
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    
    // 12-bit random data + 4-bit version (0111)
    const randomA = crypto.randomInt(0, 0x1000); // 12 bits
    const versionAndRandomA = 0x7000 | randomA; // Version 7 + 12-bit random
    
    // 2-bit variant (10) + 14-bit random data
    const randomB = crypto.randomInt(0, 0x4000); // 14 bits
    const variantAndRandomB = 0x8000 | randomB; // Variant 10 + 14-bit random
    
    // 48-bit random data
    const randomC = crypto.randomBytes(6);
    
    return [
        timestampHex.slice(0, 8),  // 32-bit timestamp high
        timestampHex.slice(8, 12), // 16-bit timestamp low
        versionAndRandomA.toString(16).padStart(4, '0'), // version + 12-bit random
        variantAndRandomB.toString(16).padStart(4, '0'), // variant + 14-bit random
        randomC.toString('hex') // 48-bit random
    ].join('-');
}

const TXID = generateUUIDv7();
const MARKET_ID = generateUUIDv7();

// Create the message (matching frontend format)
const message = {
    txid: TXID,
    marketId: MARKET_ID,
    utc: UTC,
    accountId: ACCOUNT_ID,
    buySell: BUYSELL,
    priceUsd: PRICE_USD,
    nShares: N_SHARES,
    sig: ""  // Empty signature for signing
};

const jsonMessage = JSON.stringify(message);

console.log("Message to sign:");
console.log(JSON.stringify(message, null, 2));
console.log();

// Convert hex private key to buffer
const privateKeyBuffer = Buffer.from(HEDERA_OPERATOR_KEY, 'hex');

let signature;

if (secp256k1) {
    // Use secp256k1 library (preferred)
    console.log("Using secp256k1 library for signing...");
    
    // Hash the message
    const messageHash = crypto.createHash('sha256').update(jsonMessage).digest();
    
    // Sign with secp256k1
    const sigObj = secp256k1.ecdsaSign(messageHash, privateKeyBuffer);
    
    // Convert to DER format and then base64
    signature = Buffer.from(sigObj.signature).toString('base64');
    
} else {
    // Fallback to manual implementation
    console.log("Using manual ECDSA implementation...");
    console.log("For better compatibility, install: npm install secp256k1");
    
    // This is a simplified version - in production you'd want proper ECDSA
    const messageHash = crypto.createHash('sha256').update(jsonMessage).digest();
    
    // Simple signature (this won't actually verify correctly)
    signature = Buffer.concat([
        privateKeyBuffer.slice(0, 32),
        messageHash.slice(0, 32)
    ]).toString('base64');
    
    console.log("WARNING: This is a mock signature for demonstration.");
    console.log("Install 'secp256k1' library for real signatures.\n");
}

console.log("Generated signature:");
console.log(signature);
console.log();

// Create final message with signature
const finalMessage = { ...message, sig: signature };

console.log("Final message:");
console.log(JSON.stringify(finalMessage, null, 2));
console.log();

// Output shell variables
console.log("Shell variables:");
console.log(`TXID="${TXID}"`);
console.log(`MARKET_ID="${MARKET_ID}"`);
console.log(`UTC="${UTC}"`);
console.log(`ACCOUNT_ID="${ACCOUNT_ID}"`);
console.log(`BUYSELL=${BUYSELL}`);
console.log(`PRICE_USD=${PRICE_USD}`);
console.log(`N_SHARES=${N_SHARES}`);
console.log(`SIG="${signature}"`);

// grpcurl command
console.log(`\ngrpcurl command:`);
console.log(`grpcurl -plaintext -import-path ./proto -proto api.proto -d '${JSON.stringify(finalMessage)}' localhost:8888 api.ApiService.PredictIntent`);