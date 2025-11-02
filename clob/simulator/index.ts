import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { v4 as uuidv4 } from 'uuid'

const PROTO_PATH = '../proto/clob.proto'
const SERVER = 'localhost:50051'
const ORDERS_PER_SEC = 20

// Price precision parameters
const DECIMAL_PLACES = 3

// Price drift parameters
let currentPrice = 0.5 // Start at middle of range
const PRICE_DRIFT_RATE = 0 // 0.001 // How much price can drift per order
const PRICE_VOLATILITY = 0 // 0.02 // Random volatility around drift
const PRICE_MEAN_REVERSION = 0.001 // Pull towards 0.5

// Amount parameters
const AMOUNT_MEAN = 10.0
const AMOUNT_STD = 5.0

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const Clob = protoDescriptor.clob?.Clob
if (!Clob) {
  throw new Error('Service definition not found in protoDescriptor. Check your proto file and package structure.')
}

function roundToDecimalPlaces(value: number, places: number): number {
  const factor = Math.pow(10, places)
  return Math.round(value * factor) / factor
}

function updatePrice() {
  // Random drift
  const drift = (Math.random() - 0.5) * PRICE_DRIFT_RATE
  
  // Add volatility
  const volatility = (Math.random() - 0.5) * PRICE_VOLATILITY
  
  // Mean reversion towards 0.5
  const meanReversion = (0.5 - currentPrice) * PRICE_MEAN_REVERSION
  
  // Update price
  currentPrice += drift + volatility + meanReversion
  
  // Ensure price stays between 0.0 and 1.0
  currentPrice = Math.max(0.01, Math.min(0.99, currentPrice))
  
  // Round to specified decimal places
  currentPrice = roundToDecimalPlaces(currentPrice, DECIMAL_PLACES)
}

function generateUUIDv7(): string {
  const timestamp = Date.now()
  const timestampHex = timestamp.toString(16).padStart(12, '0')
  const randomBytes = Array.from({length: 6}, () => Math.floor(Math.random() * 256))
  
  return [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    '7' + Math.floor(Math.random() * 4096).toString(16).padStart(3, '0'),
    (8 + Math.floor(Math.random() * 4)).toString(16) + Math.floor(Math.random() * 4096).toString(16).padStart(3, '0'),
    randomBytes.map(b => b.toString(16).padStart(2, '0')).join('')
  ].join('-')
}

function randomOrder() {
  updatePrice()
  
  const isBuy = Math.random() < 0.5
  
  // Create price spread around current price
  const spreadPercent = 0.005 // 0.5% spread
  const basePrice = isBuy 
    ? currentPrice - (Math.random() * spreadPercent) // Bids below current price
    : currentPrice + (Math.random() * spreadPercent) // Asks above current price
  
  const priceUsd = roundToDecimalPlaces(Math.max(0.0001, Math.min(0.9999, basePrice)), DECIMAL_PLACES)
  const nShares = Math.max(0.1, AMOUNT_MEAN + AMOUNT_STD * (Math.random() - 0.5) * 2)
  const accountId = `0.0.${Math.floor(Math.random() * 90000 + 10000)}`
  
  // New OrderRequest format
  return { 
    txid: generateUUIDv7(),
    marketid: generateUUIDv7(), 
    accountId: accountId,
    priceUsd: isBuy ? priceUsd: -1 * priceUsd,
    nShares: nShares
  }
}

function main() {
  const client = new Clob(SERVER, grpc.credentials.createInsecure())
  
  console.log(`Starting CLOB simulator:`)
  console.log(`- ${ORDERS_PER_SEC} orders/sec`)
  console.log(`- Prices between 0.0 and 1.0 (${DECIMAL_PLACES} decimal places)`)
  console.log(`- Starting price: ${currentPrice.toFixed(DECIMAL_PLACES)}`)
  console.log(`- Server: ${SERVER}`)
  console.log('')
  
  setInterval(() => {
    const order = randomOrder()
    client.PlaceOrder(order, (err: any, response: any) => {
      if (err) {
        console.error('Error:', err)
      } else {
        console.log(`${order.nShares.toFixed(2)} @ ${order.priceUsd.toFixed(DECIMAL_PLACES)} | Mid: ${currentPrice.toFixed(DECIMAL_PLACES)} | Status: ${response.status}`)
      }
    })
  }, 1000 / ORDERS_PER_SEC)
}

main()
