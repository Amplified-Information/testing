import { ClobClient } from './gen/clob.client.js'
import { OrderRequest } from './gen/clob.js'
import grpc from '@grpc/grpc-js'
import { v7 as uuidv7 } from 'uuid'
import { GrpcTransport } from '@protobuf-ts/grpc-transport'

const HOST = '0.0.0.0'
const PORT = 50051

// Configurable parameters
const INITIAL_PRICE = 0.0
const BASE_QTY = 1.5
const BASE_VOLATILITY = 0.01
const MAX_VOLATILITY = 0.05
const PRICE_RANGE = { min: -1.0, max: 1.0 }
const VOLUME_MULTIPLIER = { min: 0.5, max: 2.0 }
const ORDER_DELAY = { min: 100, max: 800 }

let price = INITIAL_PRICE // Current price
let volatility = BASE_VOLATILITY // Current volatility

// Helper function to generate random numbers within a range
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

// Helper function to round to 4 decimal places
const roundToPrecision = (value: number, precision: number) =>
  Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)

const initConnection = (): ClobClient => {
  try {
    const channel = grpc.credentials.createInsecure()
    const transport = new GrpcTransport({
        host: `${HOST}:${PORT}`,
        channelCredentials: channel
    })
    const client = new ClobClient(transport)
    console.log(client)
    return client
  } catch (err) {
    console.error('Failed to initialize gRPC connection:', err)
    process.exit(1)
  }
}

// Simulate volatility as a sine wave with random noise
const updateVolatility = () => {
  const timeFactor = Date.now() / (60 * 1000) // Time in minutes
  const noise = randomInRange(-0.005, 0.005) // Random noise
  volatility = BASE_VOLATILITY + Math.abs(Math.sin(timeFactor)) * MAX_VOLATILITY + noise
}

 // Simulate price drift with volatility
const updatePrice = () => {
  const drift = randomInRange(-volatility, volatility)
  price = roundToPrecision(price + drift, 4)

  // Ensure price stays within bounds
  if (price > PRICE_RANGE.max) price = PRICE_RANGE.max
  if (price < PRICE_RANGE.min) price = PRICE_RANGE.min
}

// Simulate volume fluctuations
const generateVolume = () => {
  const volumeMultiplier = randomInRange(VOLUME_MULTIPLIER.min, VOLUME_MULTIPLIER.max)
  return roundToPrecision(BASE_QTY * volumeMultiplier, 4)
}

const placeOrder = async (client: ClobClient) => {
  const txId = uuidv7()
  const marketId = uuidv7()
  const accountId = `0.0.${Math.floor(1000 + Math.random() * 9000)}`
  
  updateVolatility() // Update volatility
  updatePrice() // Update price
  const qty = generateVolume() // Generate volume

  const order = OrderRequest.create({
    txId: txId,
    marketId: marketId,
    accountId: accountId,
    marketLimit: 'limit',
    priceUsd: new Date().getTime() % 2 === 0 ? Math.abs(price) : 0 - Math.abs(price),
    qty: qty
  })

  try {
    const response = await client.placeOrder(order).response
    console.log('Placed order:', order, 'Response:', response)
  } catch (err) {
    console.error('Error placing order:', err)
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

console.log('Starting simulator...')
;(async () => {
  console.log('Initializing connection...')
  const client = initConnection()
  console.log('Connection initialized, starting order loop')

  while (true) {
    console.log('Placing order...')
    await placeOrder(client)
    // Random delay between orders:
    await pause(randomInRange(ORDER_DELAY.min, ORDER_DELAY.max))
  }
})().catch((err) => {
  console.error('Fatal error in main loop:', err)
  process.exit(1)
})
