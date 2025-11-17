import { ContractExecuteTransaction, ContractFunctionParameters, ContractId, TokenAssociateTransaction, TokenId } from '@hashgraph/sdk';
import { netConf, networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { initHederaClient } from './lib/hedera.ts'
import { uuid7_to_uint128 } from './utils.ts';

const [ client ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  try {
    // CLI args
    const [contractId, marketId_uuid7, statement] = process.argv.slice(2)
    if (!contractId || !marketId_uuid7 || !statement) {
      console.error(`
        UUID7=$(printf '%08x-%04x-7%03x-%x%03x-%012x\n' \
        $(( $(date +%s%3N) >> 16 )) \
        $(( $(date +%s%3N) & 0xFFFF )) \
        $(( $(date +%s%3N) & 0x0FFF )) \
        $(( 8 + RANDOM % 4 )) \
        $(( RANDOM & 0x0FFF )) \
        $(( RANDOM<<24 | RANDOM<<12 | RANDOM )) )
      `)
      console.error('Usage: ts-node newMarket.ts <contractId> <marketId_uuid7> <statement>')
      console.error('Usage example: ../node_modules/.bin/ts-node 1_newMarket.ts $SMART_CONTRACT_ID $UUID7 "Bitcoin will be over $100,000 end 2026"')
      process.exit(1)
    }

    const marketIdBigInt = uuid7_to_uint128(marketId_uuid7)

    try {
      client.operatorAccountId!.toEvmAddress()
    } catch (err) {
      console.error('Invalid userAccountId:', client.operatorAccountId, err)
      process.exit(1)
    }

    console.log(`Smart contract:\t${contractId} (${ContractId.fromString(contractId).toEvmAddress()})`)
    console.log(`Creating a new market with marketId:\t${marketId_uuid7} (${marketIdBigInt.uint128})`)
    
    // Create and execute the ContractExecuteTransaction
    const params = new ContractFunctionParameters()
      .addUint128(marketIdBigInt.uint128.toString())
      .addString(statement)
    const tx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(500_000)
      .setFunction("createNewMarket", params)
      .execute(client)

    const receipt = await tx.getReceipt(client)
    console.log('createNewMarket: ', receipt.status.toString())
  } catch (e) {
    console.error('Error creating new market:', e)
    console.error('Error creating new market. Perhaps the market already exists?')
    process.exit(1)
  }
}

;(async () => {
  await main()
  process.exit(0)
})()