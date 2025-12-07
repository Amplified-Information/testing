/**
ts-node 1_assciateToken.ts $SMART_CONTRACT_ID 0.0.5449
*/
import { ContractExecuteTransaction, ContractFunctionParameters, ContractId, TokenId } from '@hashgraph/sdk'
import { netConf, networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { initHederaClient } from './lib/hedera.ts'

const [ client ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  try {
    // CLI args: contractId, tokenId
    const [contractId, tokenId] = process.argv.slice(2)
    if (!contractId || !tokenId) {
      console.error('Usage: ts-node associateToken.ts <contractId> <tokenId>\t\t(note: USDC token address: 0.0.5449)')
      process.exit(1)
    }

    try {
      client.operatorAccountId!.toEvmAddress()
    } catch (err) {
      console.error('Invalid userAccountId:', client.operatorAccountId, err)
      process.exit(1)
    }

    console.log(`Smart contract:\t${contractId} (${ContractId.fromString(contractId).toEvmAddress()})`)
    console.log(`Associating token:\t${tokenId} (${TokenId.fromString(tokenId).toEvmAddress()}) with the smart contract ${contractId}...`)

    // Create and execute the ContractExecuteTransaction
    const params = new ContractFunctionParameters()
      .addAddress(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
    const tx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(800_000)
      .setFunction('associateToken', params)
      .execute(client)

    const receipt = await tx.getReceipt(client)
    console.log('Contract association:', receipt.status.toString())
  } catch (e) {
    console.error('Error associating token:', e)
    console.error('Perhaps the token is already associated?')
    process.exit(1)
  }
}

;(async () => {
  await main()
  process.exit(0)
})()