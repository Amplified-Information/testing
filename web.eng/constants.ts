import { LedgerId } from '@hashgraph/sdk'

const networksAvailable = [LedgerId.MAINNET, LedgerId.TESTNET, LedgerId.PREVIEWNET]
// const networkSelected = LedgerId.TESTNET
const smartContractId = '0.0.7094500'


const walletConnectProjectId = '07b98cad4c3b13377e45793d50df9181'
const walletMetaData = {
  name: 'Hedera Integration using Hedera DAppConnector - v1 approach',
  description: 'Hedera dAppConnector Example',
  // url: 'http://localhost:5173', // origin must match your domain & subdomain
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/31002956'],
}

export { 
  networksAvailable,
  smartContractId,

  walletConnectProjectId,
  walletMetaData
}
