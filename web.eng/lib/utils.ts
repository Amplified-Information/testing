import { v7 as uuidv7 } from 'uuid'
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

const genUUIDv7 = (): string => {
  return uuidv7()
}

const getMidPrice = (book: BookSnapshot): number => {
  if (book.bids.length === 0 || book.asks.length === 0) return 0.5
  // console.log(book.asks[0].price, " ", book.bids[0].price)
  return (((0 - book.asks[0].priceUsd) + book.bids[0].priceUsd) / 2)
}

export {
  uint8ToBase64,
  // uint8ToHex,
  genUUIDv7,
  getMidPrice
}