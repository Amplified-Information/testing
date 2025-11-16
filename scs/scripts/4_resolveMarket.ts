import {
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
} from '@hashgraph/sdk'
import { initHederaClient } from './lib/hedera.ts'
import { networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { getEvmAddress } from './lib/utils.ts';

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  // CLI args: contractId, userAccountEvmAddress
  const [contractId, accountId, noYesStr] = process.argv.slice(2)
  if (!contractId || !accountId || !noYesStr) {
    console.error('Usage: ts-node 4_resolveMarket.ts <contractId> <accountId> <noYes>')
    process.exit(1)
  }

  const noYes = noYesStr.toLowerCase() === 'true' || noYesStr === '1'

  console.log(`Calling oracleResolve (noYes=${noYes}) on contract ${contractId} (${ContractId.fromString(contractId).toEvmAddress()})`)
  
  const accountIdEvm = await getEvmAddress(client, accountId)
  console.log(`evm address for ${accountId}: ${accountIdEvm}`)

  try {
    const params = new ContractFunctionParameters() // .addAddress(accountIdEvm)
    params.addBool(noYes)
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(contractId))
      .setGas(100_000)
      .setFunction(
        'oracleResolve',
        params
      )

    const result = await query.execute(client)

    const yes = result.getUint256(0).toString()
    const no = result.getUint256(1).toString()

    console.log(`getUserTokens(${accountId}/${accountIdEvm}) => yes=${yes}, no=${no}`)
  } catch (err) {
    console.error('Contract call failed:', err)
    process.exit(1)
  }
}

;(async () => {
  await main()
  process.exit(0)
})()
