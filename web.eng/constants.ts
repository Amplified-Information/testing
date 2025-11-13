import { LedgerId } from '@hashgraph/sdk'
import { PredictionIntentRequest } from './gen/api'
import { genUUIDv7 } from './lib/utils'

const networksAvailable = [LedgerId.MAINNET, LedgerId.TESTNET, LedgerId.PREVIEWNET]
const smartContractId = '0.0.7243612'
const usdcAddress = '0.0.5449'
const usdcDecimals = 6
const TMP_MARKET_ID = '019a7e77-39e2-72a3-9bea-a63bdfa79d20'

const priceUsdStepSize = 0.0001
const midPriceUsdDefault = 0.5

const walletConnectProjectId = '07b98cad4c3b13377e45793d50df9181'
const walletMetaData = {
  name: 'Hedera-Prediction',
  description: 'Hedera dAppConnector Example',
  // url: 'http://localhost:5173', // origin must match your domain & subdomain
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/31002956']
}

const defaultPredictionIntentRequest = (): PredictionIntentRequest => {
  return {
    txId: genUUIDv7(),
    net: 'testnet',
    marketId: TMP_MARKET_ID,
    generatedAt: new Date().toISOString(),
    accountId: '0.0.1',
    marketLimit: 'limit',
    priceUsd: 0.5,
    qty: 0,
    sig: ''
  }
}

export { 
  networksAvailable,
  smartContractId,
  usdcAddress,
  usdcDecimals,
  TMP_MARKET_ID,

  priceUsdStepSize,
  midPriceUsdDefault,

  walletConnectProjectId,
  walletMetaData,

  defaultPredictionIntentRequest
}
