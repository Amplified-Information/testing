import {
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
} from '@hashgraph/sdk'
import { initHederaClient } from './lib/hedera.ts'
import { networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { getEvmAddress } from './lib/utils.ts';
import { uuid7_to_uint128 } from './utils.ts';

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  // CLI args: contractId, userAccountEvmAddress
  const [contractId, marketId_uuid7, accountId] = process.argv.slice(2)
  if (!contractId || !marketId_uuid7 || !accountId) {
    console.error(`Usage: ts-node getUserTokens.ts <contractId> <marketId_uuid7> <accountId>\t\t(note: current operator account id = ${operatorAccountId})`)
    process.exit(1)
  }
  const marketIdBigInt = uuid7_to_uint128(marketId_uuid7)

  console.log(`Calling getUserTokens(${marketId_uuid7}) on contract ${contractId} (${ContractId.fromString(contractId).toEvmAddress()})`)

  const accountIdEvm = await getEvmAddress(client, accountId)
  console.log(`evm address for ${accountId}: ${accountIdEvm}`)

  try {
    const params = new ContractFunctionParameters()
      .addUint128(marketIdBigInt.uint128.toString())
      .addAddress(accountIdEvm)
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(contractId))
      .setGas(100_000)
      .setFunction(
        'getUserTokens',
        params
      )

    const result = await query.execute(client)

    // getUint256 returns BigNumber-like object; convert to string
    const yes = result.getUint256(0).toString()
    const no = result.getUint256(1).toString()

    console.log(`getUserTokens(${marketId_uuid7}, ${accountId}/${accountIdEvm}) => yes=${yes}, no=${no}`)
  } catch (err) {
    console.error('Contract call failed:', err)
    process.exit(1)
  }
}

;(async () => {
  await main()
  process.exit(0)
})()
