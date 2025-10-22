import {
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
} from '@hashgraph/sdk'
import { initHederaClient } from './lib/hedera.ts'
import { netConf, networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  // CLI args: contractId, amount
  const [contractId, amount] = process.argv.slice(2)
  if (!contractId || !amount) {
    console.error('Usage: ts-node buy.ts <contractId> <amount>')
    process.exit(1)
  }

  try {
    client.operatorAccountId!.toEvmAddress()
  } catch (err) {
    console.error('Invalid userAccountId:', client.operatorAccountId, err)
    process.exit(1)
  }

  console.log(`netConf[${networkSelected}].usdcContractId: ${netConf[networkSelected].usdcContractId}`)
  console.log(`contractId: ${contractId} - ${ContractId.fromString(contractId).toEvmAddress()}`)

  try {
    const amountUnits = BigInt(amount) * BigInt(10 ** netConf[networkSelected].usdcDecimals)
    
    // 1. Approve the PredictionMarket contract to spend user's USDC collateral tokens
    const approveTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
      .setGas(10_000_000)
      .setFunction('approve',
        new ContractFunctionParameters()
          .addAddress(ContractId.fromString(contractId).toEvmAddress())
          .addUint256(amountUnits.toString()))
      .execute(client)
    
    const approveReceipt = await approveTx.getReceipt(client)
    console.log('approve status:', approveReceipt.status.toString())

  
    // 2) verify allowance (optional)
    const allowanceQuery = await new ContractCallQuery()
      .setContractId(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
      .setGas(100_000)
      .setFunction('allowance',
        new ContractFunctionParameters()
          .addAddress(client.operatorPublicKey!.toEvmAddress())
          .addAddress(ContractId.fromString(contractId).toEvmAddress()))
      .execute(client)

    const allowance = allowanceQuery.getUint256(0).toString()
    console.log(`allowance now [${netConf[networkSelected].usdcDecimals} decimals]: ${allowance}`)

    // 3) buy outcome tokens (msg.sender must be token holder)
    const buyTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1_000_000)
      .setFunction('buyShares',
        new ContractFunctionParameters().addUint256(amountUnits.toString()))
      .execute(client)

    const buyReceipt = await buyTx.getReceipt(client);
    console.log('buyShares status:', buyReceipt.status.toString());
  //   const query = new ContractExecuteTransaction()
  //     .setContractId(ContractId.fromString(contractId))
  //     .setGas(100000)
  //     .setFunction(
  //       'buyShares',
  //       new ContractFunctionParameters().addUint256(amount)
  //     )
  //     .

  //   const result = await query.execute(client)

  //   // getUint256 returns BigNumber-like object; convert to string
  //   const yes = result.getUint256(0).toString()
  //   const no = result.getUint256(1).toString()

  //   console.log(`getUserTokens(${userAccount}) => yes=${yes}, no=${no}`)
  } catch (err) {
    console.error('Contract call failed:', err)
    process.exit(1)
  }
}

(async () => {
  await main()
  process.exit(0)
})()
