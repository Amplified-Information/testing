import type { HederaKeyType, HederaNetwork } from './lib/types.ts'

type NetConf = {
  [network in HederaNetwork]: {
    usdcContractId: string
    usdcDecimals: number,
    htsPrecompileContractId: string
  }
}

const networkSelected: HederaNetwork = 'testnet'
const operatorAccountId: string = '0.0.7090546'
const operatorKeyType: HederaKeyType = 'ecdsa'

const netConf: NetConf = {
  testnet: {
    usdcContractId: '0.0.5449', // 0x1549
    usdcDecimals: 6,
    htsPrecompileContractId: '0.0.359' // 0x167
  },
  mainnet: {
    usdcContractId: '0.0.0000', // placeholder
    usdcDecimals: 6,
    htsPrecompileContractId: '0.0.359' // 0x167
  },
  previewnet: {
    usdcContractId: '0.0.0000', // placeholder
    usdcDecimals: 6,
    htsPrecompileContractId: '0.0.359' // 0x167
  }
}

export { 
  networkSelected,
  operatorAccountId,
  operatorKeyType,

  netConf
}
