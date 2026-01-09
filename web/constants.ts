import { PredictionIntentRequest } from './gen/api'
import { v7 as uuidv7 } from 'uuid'

const smartContractId = '0.0.7510299' // '0.0.7418181'

const usdcAddresses = {
  PREVIEWNET: '0.0.32531',
  TESTNET: '0.0.5449', // '0.0.429274'
  MAINNET: '0.0.456858'
}
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
    txId: uuidv7(),
    net: 'testnet',
    marketId: TMP_MARKET_ID,
    generatedAt: new Date().toISOString(),
    accountId: '0.0.1',
    marketLimit: 'limit',
    priceUsd: 0.5,
    qty: 0,
    sig: '',
    publicKey: '',
    evmAddress: '0123456789012345678901234567890123456789',
    keyType: 0 // 1 = ed25519, 2 = ecdsa_secp256k1, 0 would be rejected
  }
}

export { 
  smartContractId,
  usdcAddresses,
  usdcDecimals,
  TMP_MARKET_ID,

  priceUsdStepSize,
  midPriceUsdDefault,

  walletConnectProjectId,
  walletMetaData,

  defaultPredictionIntentRequest
}
