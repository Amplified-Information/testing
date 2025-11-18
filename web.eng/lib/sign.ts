
import { PredictionIntentRequest } from '../gen/api'
import { ObjForSigning } from '../types'
import { usdcDecimals } from '../constants'

const floatToBigIntScaledDecimals = (value: number): bigint => {
  return BigInt(value * Math.pow(10, usdcDecimals))
}

const uuidToBigInt = (uuid7_str: string): bigint => {
  const hexStr = uuid7_str.replace(/-/g, '')
  return BigInt(`0x${hexStr}`)
}

const bigIntToBytes = (value: bigint, byteLength: number): Uint8Array => {
  const hex = value.toString(16).padStart(byteLength * 2, '0')
  if (hex.length > byteLength * 2) {
    throw new Error(`Value ${value.toString()} exceeds ${byteLength * 8}-bit`)
  }
  return Uint8Array.from(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
}

const serializeObjForSigning = (obj: ObjForSigning): Uint8Array => {
  const parts = [
    bigIntToBytes(uuidToBigInt(obj.txId_uuid), 16),                     // uint128
    bigIntToBytes(uuidToBigInt(obj.marketId_uuid), 16),                 // uint128
    bigIntToBytes(floatToBigIntScaledDecimals(obj.priceUsd_abs), 32)    // uint256
  ]

  const arrLen = parts.reduce((a, b) => a + b.length, 0)
  const serializedArr = new Uint8Array(arrLen)

  let offset = 0
  for (const p of parts) {
    serializedArr.set(p, offset)
    offset += p.length
  }
  return serializedArr
}

// // Convert Decimal → fixed-width big-endian byte array
// const decimalToBytes = (d: Decimal, byteLength: number): Uint8Array => {
//   const hex = d.toHex().replace(/^0x/, '').padStart(byteLength * 2, '0')
//   if (hex.length > byteLength * 2) {
//     throw new Error(`Value ${d.toString()} exceeds ${byteLength * 8}-bit`)
//   }
//   return Uint8Array.from(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
// }

// const serializeObjForSigning = (obj: ObjForSigning): Uint8Array => {
//   // see corresponding api/server/lib/sign.go
//   // N.B. the order of the fields is critical
//   const parts = [
//     decimalToBytes(obj.txId_uuid_uint128, 16),     // uint128
//     decimalToBytes(obj.marketId_uuid_uint128, 16), // uint128
//     decimalToBytes(obj.priceUsd_abs_uint256, 32)   // uint256
//   ]

//   // Concatenate into a single Uint8Array
//   const arrLen = parts.reduce((a, b) => a + b.length, 0)
//   const serializedArr = new Uint8Array(arrLen)

//   let offset = 0
//   for (const p of parts) {
//     serializedArr.set(p, offset)
//     offset += p.length
//   }
//   return serializedArr
// }

// const getSerializedPayloadForSigning = (predictionIntentRequest: PredictionIntentRequest): Uint8Array => {
//   const objForSigning: ObjForSigning = {
//     txId_uuid_uint128:     uuid7_to_decimal(predictionIntentRequest.txId),
//     marketId_uuid_uint128: uuid7_to_decimal(predictionIntentRequest.marketId),
//     // N.B. Math.abs(priceUsd)
//     priceUsd_abs_uint256: new Decimal(Math.abs(predictionIntentRequest.priceUsd)).times(new Decimal(10).pow(usdcDecimals)) // priceUsd does not get rounded
//   }
//   return serializeObjForSigning(objForSigning)
// }

const getSerializedPayloadForSigning = (predictionIntentRequest: PredictionIntentRequest): Uint8Array => {
  const objForSigning: ObjForSigning = {
    txId_uuid: predictionIntentRequest.txId,
    marketId_uuid: predictionIntentRequest.marketId,
    priceUsd_abs: Math.abs(predictionIntentRequest.priceUsd)
  }
  return serializeObjForSigning(objForSigning)
}

export {
  getSerializedPayloadForSigning
}
