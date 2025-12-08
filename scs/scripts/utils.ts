import { proto } from '@hashgraph/proto'
import { PublicKey } from '@hashgraph/sdk'

type HederaKeyType = 'ECDSA' | 'ED25519'

const uuid7_to_uint128 = (uuid7: string): bigint => {
  const hexStr = uuid7.replace(/-/g, '') // Remove hyphens
  if (hexStr.length !== 32) {
    throw new Error('Invalid UUIDv7 format')
  }
  return BigInt('0x' + hexStr)
}

function uint128_to_uuid7(someBigInt: bigint): string {
  // Ensure the random number is 128 bits
  const hexStr = someBigInt.toString(16).padStart(32, '0')

  // Extract fields
  const timestamp = hexStr.slice(0, 12) // First 48 bits (12 hex chars)
  const version = '7' // UUIDv7 version
  const sequence = hexStr.slice(13, 16) // Next 12 bits (3 hex chars)
  const randomData = hexStr.slice(16) // Remaining 64 bits

  // Construct UUIDv7
  return `${timestamp.slice(0,8)}-${timestamp.slice(8)}-${version}${sequence}-${randomData.slice(0, 4)}-${randomData.slice(4)}`
}

function buildSignatureMap(publicKey: PublicKey, signature: Uint8Array, keyType: HederaKeyType): Uint8Array {
  
  switch (keyType) {
    case 'ECDSA':
      { 
        const sigPair = proto.SignaturePair.create({
          pubKeyPrefix: publicKey.toBytesRaw(),
          ECDSASecp256k1: signature  // ECDSA
        })

        const sigMap = proto.SignatureMap.create({
          sigPair: [sigPair]
        })
        const bytes = proto.SignatureMap.encode(sigMap).finish()
        return bytes
      }
    case 'ED25519': 
      { 
        const sigPair = proto.SignaturePair.create({
          pubKeyPrefix: publicKey.toBytesRaw(),
          ed25519: signature // ed25519
        })

        const sigMap = proto.SignatureMap.create({
          sigPair: [sigPair]
        })
        const bytes = proto.SignatureMap.encode(sigMap).finish()
        return bytes 
      }
    default:
      throw new Error(`Unsupported key type: ${keyType}`)
  }
  
}

export {
  uuid7_to_uint128,
  uint128_to_uuid7,
  buildSignatureMap
}