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

export {
  __dirname,
  getPubKey,
  getEvmAddress
}
