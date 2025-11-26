import { BookSnapshot } from '../gen/clob'

const uint8ToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// const uint8ToHex = (bytes: Uint8Array): string => {
//   return Array.from(bytes)
//     .map((byte) => byte.toString(16).padStart(2, '0'))
//     .join('');
// }

// const genUUIDv7 = (): string => {
//   return uuidv7()
// }

const getMidPrice = (book: BookSnapshot): number | undefined => {
  if (book.bids.length === 0 || book.asks.length === 0) return undefined
  // console.log(book.asks[0].priceUsd, ' ', book.bids[0].priceUsd)
  return 0 - ((book.asks[0].priceUsd - book.bids[0].priceUsd) / 2)
}

const getSpreadPercent = (book: BookSnapshot): number | undefined => {
  if (book.bids.length === 0 || book.asks.length === 0) return undefined
  // console.log(book.asks[0].priceUsd, ' ', book.bids[0].priceUsd)
  return ((0 - book.asks[0].priceUsd - book.bids[0].priceUsd) / book.bids[0].priceUsd) * 100
}

const floatToBigIntScaledDecimals = (value: number, nDecimals: number): bigint => {
  const [integerPart, fractionalPart = ''] = value.toString().split('.')
  const scaledValue = '' + integerPart + '' + fractionalPart.padEnd(nDecimals, '0').slice(0, nDecimals)
  return BigInt(scaledValue)
}

export {
  uint8ToBase64,
  // uint8ToHex,
  getMidPrice,
  getSpreadPercent,
  floatToBigIntScaledDecimals
}
