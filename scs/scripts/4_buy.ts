import {
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId
} from '@hashgraph/sdk'
import { initHederaClient } from './lib/hedera.ts'
import { netConf, networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { uuid7_to_uint128 } from './utils.ts'
import { keccak256 } from 'ethers/crypto'
import { ethers } from 'ethers'

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const prefixMessageToSign = (messageUtf8: string) => {
  return '\x19Hedera Signed Message:\n' + messageUtf8.length + messageUtf8
}

type KnownParam = {
  sig: string
  // collateralUsdAbsScaled: string
  // marketId: string
  txId: string
}

const main = async () => {
  // CLI args: contractId, amount
  const [contractId, marketId_uuid7, collateralUSDC/*, nPositionTokens*/] = process.argv.slice(2)
  if (!contractId || !marketId_uuid7 || !collateralUSDC) {
    console.error('Usage: ts-node buy.ts <contractId> <marketId_uuid7> <collateralUSDC>')
    console.error('Example usage: ts-node buy.ts $SMART_CONTRACT_ID $UUID7 0.0173')
    process.exit(1)
  }

  const scaler = 10000
  const collateralUSDCx10000 = parseFloat(collateralUSDC) * scaler // rounding up to 4 decimal places acceptable
  const collateralUSDCbig = BigInt(Math.floor(collateralUSDCx10000)) * BigInt(10 ** netConf[networkSelected].usdcDecimals) / BigInt(scaler)
   

  const yesAccount = client.operatorPublicKey!.toEvmAddress() // TODO - make yesAccount and noAccount different accounts...
  const noAccount = client.operatorPublicKey!.toEvmAddress()
  const marketIdBigInt = uuid7_to_uint128(marketId_uuid7)

  // known keccak and sig - see ./api/server/lib/demo/sigDemo.go
  // const knownKeccakHex = '19486564657261205369676e6564204d6573736167653a0a33310befbfbd5e49efbfbd302060712065efbfbd17efbfbd335fefbfbdefbfbdefbfbdefbfbdefbfbdefbfbddba9efbfbdefbfbdefbfbd6345efbfbd7a32'
  // const knownSigHex = '0a650a2103b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac07873240d0d54810f170b385e9dae222a2f4e42c32b334f43f1d344a1bee93238cee2a2819c6b2c2bc7933054e47772d28bcbae7e98ab56419125bbd301f0884a5340296'

  
  // known payloads and signatures for 0.0.7090546
  // see: sigDemo.go
  // const payload1Hex = '0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000002019aeeb456ec75b4829cb41fdfd67610'
	// const sig1Hex =     '58029b63c4145c35bfcf300c3cd2b307facc18f52b53957f7f10a5816b3b64801e8687cadb06cd07648098fe1c85c7dec252068a249d57c1ff315d6bdba8989a'
	// const payload2Hex = '0000000000000000000000000000000000000000000000000000000000003a980189c0a87e807e808000000000000002019aeeb456ec75b4829cb41fdfd67610'
	// const sig2Hex =     '8a10968171368e9ea94978431068dcbbaacfec1d70ea5956bc349cb6f0cdbb4145a6cec3325b9b8285b51b14b513b4933471c2cd3039ce5a211c0de46319d830'
  // const keccak1Hex = keccak256(Buffer.from(payload1Hex)).slice(2)
  // const keccak2Hex = keccak256(Buffer.from(payload2Hex)).slice(2)
  // const keccak1Utf8 = Buffer.from(keccak1Hex, 'hex').toString()
  // const keccak2Utf8 = Buffer.from(keccak2Hex, 'hex').toString()
  // const keccak1PrefixedUtf8 = prefixMessageToSign(keccak1Utf8)
  // const keccak2PrefixedUtf8 = prefixMessageToSign(keccak2Utf8)

  // // assembled prefixed keccaks:
  // const keccakPrefixedYes = Buffer.from(keccak1PrefixedUtf8, 'utf8')
  // const keccakPrefixedNo = Buffer.from(keccak2PrefixedUtf8, 'utf8')

  // // assembled signatures:
  // const sigYes =  Buffer.from(sig1Hex, 'hex')
  // const sigNo =   Buffer.from(sig2Hex, 'hex')

  // const payloadKnownHex = '0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000002019aeeb456ec75b4829cb41fdfd67610'
	// const sigKnownHex =     '58029b63c4145c35bfcf300c3cd2b307facc18f52b53957f7f10a5816b3b64801e8687cadb06cd07648098fe1c85c7dec252068a249d57c1ff315d6bdba8989a'
	
  // known params
  const knownParams: Record<string, KnownParam> = {
    '0189c0a8-7e80-7e80-8000-000000000001': {
      txId: '2229c0a8-7e80-7e80-8000-000000000091',
      sig: '<TO BE CALCULATED>'
    },
    '0189c0a8-7e80-7e80-8000-000000000002': {
      txId: '2229c0a8-7e80-7e80-8000-000000000092',
      sig: '<TO BE CALCULATED>'
    },
    '0189c0a8-7e80-7e80-8000-000000000003': {
      txId: '2229c0a8-7e80-7e80-8000-000000000093',
      sig: '<TO BE CALCULATED>'
    }
  }

  for (const marketId in knownParams) {
    const knownParam = knownParams[marketId]
    console.log(marketId)
    console.log(knownParam.txId)
    // const packed = ethers.solidityPacked(['uint256', 'uint128', 'uint128'],[collateralUSDCbig, uuid7_to_uint128(marketId), uuid7_to_uint128(knownParam.txId)])
    console.log(uuid7_to_uint128(marketId).toString())
    console.log(collateralUSDCbig.toString())
    // console.log(Buffer.from(packed).toString('hex'))
  }

  process.exit(0)

  try {
    client.operatorAccountId!.toEvmAddress()
  } catch (err) {
    console.error('Invalid userAccountId:', client.operatorAccountId, err)
    process.exit(1)
  }

  console.log(`netConf[${networkSelected}].usdcContractId: ${netConf[networkSelected].usdcContractId}`)
  console.log(`contractId: ${contractId} - ${ContractId.fromString(contractId).toEvmAddress()}`)

  try {
    // const nPositionTokensBig = BigInt(nPositionTokens)
    console.log(`Buying ${collateralUSDCbig} position tokens (both buy and sell side) with ${collateralUSDCbig} (USDC base units) as collateral (x2)...`)
    
    // 1. Approve the PredictionMarket contract to spend user's USDC collateral tokens (x2)
    const approveTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
      .setGas(10_000_000)
      .setFunction('approve', // approve inherited from ERC20 
        new ContractFunctionParameters()
          .addAddress(ContractId.fromString(contractId).toEvmAddress())
          .addUint256((collateralUSDCbig * BigInt(2)).toString())) /** Note: x2 since buy side and sell side are from the same account...**/
      .execute(client)
    
    const approveReceipt = await approveTx.getReceipt(client)
    console.log('approve status:', approveReceipt.status.toString())

  
    // 2) verify allowance (optional)
    const allowanceQuery = await new ContractCallQuery()
      .setContractId(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
      .setGas(100_000)
      .setFunction('allowance', // allowance inherited from ERC20
        new ContractFunctionParameters()
          .addAddress(client.operatorPublicKey!.toEvmAddress())
          .addAddress(ContractId.fromString(contractId).toEvmAddress()))
      .execute(client)

    const allowance = allowanceQuery.getUint256(0).toString()
    console.log(`allowance now [${netConf[networkSelected].usdcDecimals} decimals]: ${allowance}`)

    // 3) buy outcome tokens (msg.sender must be token holder)
    // const buyTx = await new ContractExecuteTransaction()
    //   .setContractId(contractId)
    //   .setGas(1_000_000)
    //   .setFunction('buyPositionTokens',
    //     new ContractFunctionParameters()
    //       .addUint256(amountUnits.toString()))
    //   .execute(client)

    // const buyReceipt = await buyTx.getReceipt(client);
    // console.log('buyPositionTokens status:', buyReceipt.status.toString());


     // 4) buy outcome tokens on behalf of another account which has an allowance set (buyPositionTokensOnBehalf)
    console.log(`*** client.operatorAccountId!.toEvmAddress(): ${client.operatorAccountId!.toEvmAddress()}`)
    const params = new ContractFunctionParameters()
        // uint128 marketId,
        // address signerYes,
        // address signerNo,
        // uint256 collateralUsdAbsScaled,
        // uint128 txIdYes,
        // uint128 txIdNo,
        // bytes calldata sigYes,
        // bytes calldata sigNo
      .addUint128(marketIdBigInt.toString())
      .addAddress(yesAccount)
      .addAddress(noAccount)
      .addUint256(collateralUSDCbig.toString()) // collateralUSDC
      .uint128(Buffer.from(knownKeccakHex, 'hex')) // txIdYes
      .uint128(Buffer.from(knownKeccakHex, 'hex'))  // txIdNo
      .addBytes(Buffer.from(knownSigHex, 'hex')) // sigYes
      .addBytes(Buffer.from(knownSigHex, 'hex')) // sigNo
      // .addUint256(nPositionTokensBig.toString()) // nPositionTokens
    const buyTx4 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(2_000_000) // approx 1 million per USDC transfer (two USDC transfers in the atomic function)
      .setFunction(
        'buyPositionTokensOnBehalfAtomic',
        params
      )
      .execute(client)

    const buyReceipt4 = await buyTx4.getReceipt(client)
    console.log(`buyPositionTokensOnBehalf(marketId=${marketId_uuid7},...) status:`, buyReceipt4.status.toString())
 
 
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
