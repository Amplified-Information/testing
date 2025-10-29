import { Point } from '@noble/secp256k1';

const compressedKey = '03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787';

// Decode the compressed key into a Point on secp256k1
const point = Point.fromHex(compressedKey);

// Convert to uncompressed (false = uncompressed)
const uncompressed = point.toBytes(false);

// Print as hex
console.log(Buffer.from(uncompressed).toString('hex'));
