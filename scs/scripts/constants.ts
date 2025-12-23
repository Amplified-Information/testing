import type { HederaKeyType, HederaNetwork } from './lib/types.ts'

type NetConf = {
  [network in HederaNetwork]: {
    usdcContractId: string
    usdcDecimals: number,
    htsPrecompileContractId: string
  }
}

const networkSelected: HederaNetwork = process.env.HEDERA_NETWORK_SELECTED as HederaNetwork
const operatorAccountId: string = process.env.HEDERA_OPERATOR_ACCOUNT_ID as string
const operatorKeyType: HederaKeyType = process.env.HEDERA_OPERATOR_KEY_TYPE as HederaKeyType

const netConf: NetConf = {
  // https://www.circle.com/multi-chain-usdc/hedera
  testnet: {
    usdcContractId: '0.0.5449', // 0x1549
    usdcDecimals: 6,
    htsPrecompileContractId: '0.0.359' // 0x167
  },
  mainnet: {
    usdcContractId: '0.0.5449', // placeholder
    usdcDecimals: 6,
    htsPrecompileContractId: '0.0.359' // 0x167
  },
  previewnet: {
    usdcContractId: '0.0.31462', // see: scripts/createUSDC_previewnet.ts
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
