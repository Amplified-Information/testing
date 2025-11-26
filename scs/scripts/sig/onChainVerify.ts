import { ContractCallQuery, ContractFunctionParameters, ContractId } from '@hashgraph/sdk'
import { networkSelected, operatorAccountId, operatorKeyType } from '../constants.ts'
import { initHederaClient } from '../lib/hedera.ts'
import { ethers } from 'ethers'

// CLI args: contractId, tokenId
const [contractId, publicKeyHex, payload, sigHex] = process.argv.slice(2)
if (!contractId || !publicKeyHex || !payload || !sigHex) {
  console.error('Usage: ts-node onChainVerify.ts <contractId> <publicKeyHex> <payload> <sigHex>')
  process.exit(1)
}

console.log(`publicKeyHex: ${publicKeyHex}`)
console.log(`payload: ${payload}`)
console.log(`sigHex: ${sigHex}`)

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const verify = async () => {
  const rHex = sigHex.slice(0, 64)
  const sHex = sigHex.slice(64, 128)
  const v = 27
  console.log('r (hex):', rHex)
  console.log('s (hex):', sHex)
  console.log(`v: ${v}`) // 27 or 28

  const r = Uint8Array.from(Buffer.from(rHex, 'hex'))
  const s = Uint8Array.from(Buffer.from(sHex, 'hex'))

  const payloadHashedHex = ethers.keccak256(Uint8Array.from(Buffer.from(payload, 'utf8'))).slice(2)
  console.log(`payloadHashedHex: ${payloadHashedHex}`)

  const payloadPrefixedHashedHex = ethers.keccak256(ethers.concat([
    ethers.toUtf8Bytes('\x19Hedera Signed Message:\n32'),
    Uint8Array.from(Buffer.from(payloadHashedHex, 'hex'))
  ])).slice(2)
  console.log(`payloadPrefixedHashedHex: ${payloadPrefixedHashedHex}`)

  await onChainVerify(r, s, v, payloadPrefixedHashedHex)
}

const onChainVerify = async (r: Uint8Array, s: Uint8Array, v: number, hashHex: string) => {
  try {
    const params = new ContractFunctionParameters()
      .addBytes32(r)
      .addBytes32(s)
      .addUint8(v)
      .addBytes32(Uint8Array.from(Buffer.from(hashHex, 'hex')))
      
    const query = new ContractCallQuery() // read-only
      .setContractId(ContractId.fromString(contractId))
      .setGas(100_000)
      .setFunction('verify', params)

      // const cost = await query.getCost(client)
      const result = await query
        // .setQueryPayment(cost)
        .execute(client)
      console.log(`on-chain result.getAddress(0): ${result.getAddress(0)}`)
      console.log(`--> verify the returned address above mathes the evm address for ${operatorAccountId}!`)
      // console.log('signature valid?', wallet.address.toLowerCase() === '0x' + result.getAddress(0))
  } catch (err) {
    console.error('Contract call failed:', err)
  }
}

(async () => {
  await verify()
  process.exit(0)
})()