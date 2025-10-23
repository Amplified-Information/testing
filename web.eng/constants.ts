import { LedgerId } from '@hashgraph/sdk'
import { PredictionIntentRequest } from './gen/api'
import { genUUIDv7 } from './lib/utils'

const networksAvailable = [LedgerId.MAINNET, LedgerId.TESTNET, LedgerId.PREVIEWNET]
// const networkSelected = LedgerId.TESTNET
const smartContractId = '0.0.7094500'
const usdcAddress = '0.0.5449'
const usdcDecimals = 6


const walletConnectProjectId = '07b98cad4c3b13377e45793d50df9181'
const walletMetaData = {
  name: 'Hedera-Prediction',
  description: 'Hedera dAppConnector Example',
  // url: 'http://localhost:5173', // origin must match your domain & subdomain
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/31002956'],
}

const defaultPredictionIntentRequest: PredictionIntentRequest = {
  txid: genUUIDv7(),
  utc: new Date().toISOString(),
  accountId: '0.0.1',
  buySell: false,
  price: 0,
  amount: 0,
  sig: ''
}

export { 
  networksAvailable,
  smartContractId,
  usdcAddress,
  usdcDecimals,

  walletConnectProjectId,
  walletMetaData,

  defaultPredictionIntentRequest
}
