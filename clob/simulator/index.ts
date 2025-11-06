import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

const PROTO_PATH = '../proto/clob.proto'
const SERVER = 'localhost:50051'
const ORDERS_PER_SEC = 5

// Price precision parameters
const DECIMAL_PLACES = 4

// Market making parameters
let currentMidPrice = 0.5000 // Start at middle of range
const TICK_SIZE = 0.0001 // Minimum price increment
const SPREAD_BPS = 5 // 5 basis points (0.05%) spread - much tighter
const MAX_SPREAD_BPS = 25 // Maximum spread in volatile conditions

// Market dynamics
const PRICE_DRIFT_RATE = 0.00005 // Minimal trend over time
const PRICE_VOLATILITY = 0.001 // Lower volatility for tighter spreads
const MEAN_REVERSION_STRENGTH = 0.05 // Stronger pull back to fair value
const MOMENTUM_FACTOR = 0.1 // Reduced price momentum from imbalance

// Order flow parameters  
const ORDER_SIZE_MIN = 10
const ORDER_SIZE_MAX = 100
const MARKET_ORDER_PROBABILITY = 0.4 // 40% market orders for crossing
const LARGE_ORDER_PROBABILITY = 0.05 // 5% large orders
// const ORDER_CANCEL_PROBABILITY = 0.02 // 2% order cancellations

// Market state tracking
let orderImbalance = 0 // +1 = more buys, -1 = more sells
let recentTradePrice = currentMidPrice
let volatilityMeasure = 0.001
let buyOrderCount = 0
let sellOrderCount = 0

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

function updateMarketState() {
  // Random drift
  const drift = (Math.random() - 0.5) * PRICE_DRIFT_RATE
  
  // Add volatility (higher when imbalanced)
  const currentVolatility = PRICE_VOLATILITY * (1 + Math.abs(orderImbalance) * 0.5)
  const volatility = (Math.random() - 0.5) * currentVolatility
  
  // Mean reversion towards fair value
  const meanReversion = (0.5 - currentMidPrice) * MEAN_REVERSION_STRENGTH
  
  // Momentum from order imbalance (buying pressure pushes price up)
  const momentum = orderImbalance * MOMENTUM_FACTOR * volatilityMeasure
  
  // Update mid price
  currentMidPrice += drift + volatility + meanReversion + momentum
  
  // Ensure price stays between bounds
  currentMidPrice = Math.max(0.01, Math.min(0.99, currentMidPrice))
  
  // Round to tick size
  currentMidPrice = Math.round(currentMidPrice / TICK_SIZE) * TICK_SIZE
  currentMidPrice = roundToDecimalPlaces(currentMidPrice, DECIMAL_PLACES)
  
  // Update volatility measure (exponentially weighted)
  volatilityMeasure = volatilityMeasure * 0.95 + Math.abs(volatility) * 0.05
  
  // Decay order imbalance over time
  orderImbalance *= 0.98
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

function generateRealisticOrder() {
  updateMarketState()
  
  const isMarketOrder = Math.random() < MARKET_ORDER_PROBABILITY
  
  // Balance buy/sell orders, with slight bias toward liquidity provision
  // If order book is imbalanced, favor the opposite side
  let buyProbability = 0.5
  if (orderImbalance > 0.3) {
    buyProbability = 0.3 // Too many buys, favor sells
  } else if (orderImbalance < -0.3) {
    buyProbability = 0.7 // Too many sells, favor buys
  }
  
  const isBuy = Math.random() < buyProbability
  
  // Calculate current spread based on volatility
  const dynamicSpreadBps = Math.min(MAX_SPREAD_BPS, SPREAD_BPS * (1 + volatilityMeasure * 10))
  const halfSpread = (dynamicSpreadBps / 10000) * currentMidPrice
  
  let orderPrice: number
  
  if (isMarketOrder) {
    // Market orders: cross the spread aggressively to guarantee execution
    orderPrice = isBuy 
      ? currentMidPrice + halfSpread * 2.0  // Buy well above ask
      : currentMidPrice - halfSpread * 2.0  // Sell well below bid
    
    // Update order flow imbalance
    orderImbalance += isBuy ? 0.2 : -0.2
  } else {
    // Limit orders: compete for better prices within tight spread
    const priceOffset = Math.random() * halfSpread * 0.8 // Stay within 80% of half spread
    orderPrice = isBuy
      ? currentMidPrice - priceOffset  // Bids below mid
      : currentMidPrice + priceOffset  // Asks above mid
  }
  
  // Round to tick size
  orderPrice = Math.round(orderPrice / TICK_SIZE) * TICK_SIZE
  orderPrice = Math.max(0.0001, Math.min(0.9999, orderPrice))
  orderPrice = roundToDecimalPlaces(orderPrice, DECIMAL_PLACES)
  
  // Generate realistic order sizes
  const isLargeOrder = Math.random() < LARGE_ORDER_PROBABILITY
  const baseSize = isLargeOrder ? ORDER_SIZE_MAX * 2 : ORDER_SIZE_MIN
  const sizeRange = isLargeOrder ? ORDER_SIZE_MAX : ORDER_SIZE_MAX - ORDER_SIZE_MIN
  const nShares = baseSize + Math.random() * sizeRange
  
  const accountId = `0.0.${Math.floor(Math.random() * 90000 + 10000)}`
  
  // Track recent trade price for reference
  if (isMarketOrder) {
    recentTradePrice = orderPrice
  }
  
  // Track order counts for debugging
  if (isBuy) {
    buyOrderCount++
  } else {
    sellOrderCount++
  }
  
  return { 
    tx_id: generateUUIDv7(),
    market_id: generateUUIDv7(),
    account_id: accountId,
    market_limit: "", 
    price_usd: isBuy ? orderPrice : -1 * orderPrice,  // Positive for buys, negative for sells
    n_shares: roundToDecimalPlaces(nShares, 1)
  }
}

function main() {
  const client = new Clob(SERVER, grpc.credentials.createInsecure())
  
  console.log(`Starting Realistic CLOB Simulator:`)
  console.log(`- ${ORDERS_PER_SEC} orders/sec`)
  console.log(`- Prices between 0.0 and 1.0 (${DECIMAL_PLACES} decimal places)`)
  console.log(`- Starting mid price: ${currentMidPrice.toFixed(DECIMAL_PLACES)}`)
  console.log(`- Spread: ${SPREAD_BPS} bps base (dynamic based on volatility)`)
  console.log(`- Market orders: ${(MARKET_ORDER_PROBABILITY * 100).toFixed(0)}%`)
  console.log(`- Server: ${SERVER}`)
  console.log('')
  
  setInterval(() => {
    const order = generateRealisticOrder()
    client.PlaceOrder(order, (err: any, response: any) => {
      if (err) {
        console.error('Error:', err)
      } else {
        const orderType = Math.abs(order.price_usd) > currentMidPrice + (currentMidPrice * 0.01) ? 'MKT' : 'LMT'
        const side = order.price_usd > 0 ? 'BUY' : 'SELL'
        const totalOrders = buyOrderCount + sellOrderCount
        const buyRatio = totalOrders > 0 ? (buyOrderCount / totalOrders * 100).toFixed(1) : '0.0'
        console.log(`${side} ${orderType} ${order.n_shares.toFixed(1)} @ ${Math.abs(order.price_usd).toFixed(DECIMAL_PLACES)} | Mid: ${currentMidPrice.toFixed(DECIMAL_PLACES)} | ${response.status} | B/S: ${buyRatio}%/${(100-parseFloat(buyRatio)).toFixed(1)}%`)
      }
    })
  }, 1000 / ORDERS_PER_SEC)
}

main()
