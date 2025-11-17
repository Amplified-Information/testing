const uuid7_to_uint128 = (uuid7: string): { uint128: BigInt } => {
  const hexStr = uuid7.replace(/-/g, '') // Remove hyphens
  if (hexStr.length !== 32) {
    throw new Error('Invalid UUIDv7 format')
  }
  return { uint128: BigInt('0x' + hexStr) }
}

function uint128_to_uuid7(someBigInt: BigInt): string {
  // Ensure the random number is 128 bits
  const hexStr = someBigInt.toString(16).padStart(32, '0');

  // Extract fields
  const timestamp = hexStr.slice(0, 12); // First 48 bits (12 hex chars)
  const version = '7'; // UUIDv7 version
  const sequence = hexStr.slice(13, 16); // Next 12 bits (3 hex chars)
  const randomData = hexStr.slice(16); // Remaining 64 bits

  // Construct UUIDv7
  return `${timestamp.slice(0,8)}-${timestamp.slice(8)}-${version}${sequence}-${randomData.slice(0, 4)}-${randomData.slice(4)}`;
}

export {
  uuid7_to_uint128,
  uint128_to_uuid7
}