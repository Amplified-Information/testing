import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { v4 as uuidv4 } from 'uuid'

const PROTO_PATH = '../proto/clob.proto'
const SERVER = 'localhost:50051'
const BASE_PRICE = 50
const PRICE_VOL = 2
const AMOUNT_MEAN = 1.5
const AMOUNT_STD = 2
const ORDERS_PER_SEC = 5

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

function randomOrder() {
  const is_buy = Math.random() < 0.5
  const price = Math.round(BASE_PRICE + PRICE_VOL * (Math.random() - 0.5) * 2)
  const amount = Math.max(1, Math.round(AMOUNT_MEAN + AMOUNT_STD * (Math.random() - 0.5) * 2))
  const owner = `0.0.${Math.floor(Math.random() * 90000 + 10000)}`
  const timestamp_ns = Date.now() * 1_000_000
  const tx_hash = uuidv4()
  return { owner, is_buy, price, amount, timestamp_ns, tx_hash }
}

function main() {
  const client = new Clob(SERVER, grpc.credentials.createInsecure())
  setInterval(() => {
    const order = randomOrder()
    client.PlaceOrder(order, (err: any, response: any) => {
      if (err) {
        console.error('Error:', err)
      } else {
        console.log('Sent:', order, '| Response:', response.status)
      }
    })
  }, 1000 / ORDERS_PER_SEC)
}

main()