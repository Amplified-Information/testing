import { AccountId, AccountInfoQuery, Client } from '@hashgraph/sdk'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { networkSelected } from '../constants.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getPubKey = async (client: Client, accountId: string | AccountId, withPreamble: boolean = false) => {
  const info = await new AccountInfoQuery()
    .setAccountId(accountId)
    .execute(client)
  console.log('raw key:', info.key.toString())

  if (withPreamble) {
    return info.key.toString()
  } else {
    return '0x' + info.key.toString().slice(-66) // last 66 characters
  }
}

const getEvmAddress = async (client: Client, accountId: string | AccountId) => {
  const result = await fetch(`https://${networkSelected}.mirrornode.hedera.com/api/v1/accounts/${accountId}`)
  const data = await result.json()
  return data.evm_address
}

const sig2rsv = (sigHashpackHex: string): [Uint8Array, Uint8Array, number] => {
  const sigBuffer = Buffer.from(sigHashpackHex, 'hex')
  if (sigBuffer.length === 65) {
    const r = sigBuffer.slice(0, 32)
    const s = sigBuffer.slice(32, 64)
    const v = sigBuffer[64]
    return [r, s, v]
  } else if (sigBuffer.length === 64) {
    const r = sigBuffer.subarray(0, 32)
    const s = sigBuffer.subarray(32, 64)
    const v = 27 // hardcoded for now (could be 28) // TODO
    return [r, s, v]
  } else {
    throw new Error('Invalid signature length')
  }
}

export {
  __dirname,
  getPubKey,
  getEvmAddress,
  sig2rsv
}
