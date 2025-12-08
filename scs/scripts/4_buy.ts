/**
Signing OrderIntent...
Signer.tsx:222 x:  0x248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c
Signer.tsx:225 packedKeccakHex: 248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
Signer.tsx:235 msgToSign (base64) (len=44): JIxvDk0PVNvG45apwZKiK314/uueHUyoWzlQDZ6mx9U=
Signer.tsx:236 packedKeccakHex (len=32): 248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
Signer.tsx:238 sigHex (len=64): ae4cedbdd9b3dcd94ba8e0909f35bb93ff5bd8a15ef87d24f610802b756cc7363acafd3151d6c91182efe5cefe7d6e42d1a3568022e928f06012184fd7a2820b
Signer.tsx:36 {"txId":"019af9dc-4e5f-7518-80af-b44d6938149c","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T17:29:16.127Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":0.0274,"sig":"rkztvdmz3NlLqOCQnzW7k/9b2KFe+H0k9hCAK3VsxzY6yv0xUdbJEYLv5c7+fW5C0aNWgCLpKPBgEhhP16KCCw=="}

# export SMART_CONTRACT_ID=0.0.7388577
export PUBLIC_KEY_HEX=03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787

export PAYLOAD_HEX=00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c
export MARKET_ID_HEX=0189c0a87e807e808000000000000003
export TX_ID_HEX=019af9dc4e5f751880afb44d6938149c
export SIG_RAW_HEX=ae4cedbdd9b3dcd94ba8e0909f35bb93ff5bd8a15ef87d24f610802b756cc7363acafd3151d6c91182efe5cefe7d6e42d1a3568022e928f06012184fd7a2820b

ts-node 4_buy.ts $SMART_CONTRACT_ID $PAYLOAD_HEX $SIG_RAW_HEX $PUBLIC_KEY_HEX
*/

import {
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  PublicKey
} from '@hashgraph/sdk'
import { initHederaClient } from './lib/hedera.ts'
import { netConf, networkSelected, operatorAccountId, operatorKeyType } from './constants.ts'
import { buildSignatureMap } from './utils.ts'

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  // CLI args: contractId, amount
  const [contractId, payloadHex, sigRawHex, publicKeyHex] = process.argv.slice(2)
  if (!contractId || !payloadHex || !sigRawHex || !publicKeyHex) {
    console.error('Usage: ts-node buy.ts <contractId> <payloadHex> <sigRawHex> <publicKeyHex>')
    console.error('Example usage: ts-node buy.ts $SMART_CONTRACT_ID $PAYLOAD_HEX $SIG_RAW_HEX $PUBLIC_KEY_HEX')
    process.exit(1)
  }
  // const payloadHex = '00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c'
  const collateralUsdAbsScaled = BigInt('0x' + payloadHex.substring(0, 64))
  const marketId = BigInt('0x' + payloadHex.substring(64, 96))
  const txId = BigInt('0x' + payloadHex.substring(96, 128))

  const operatorPublicKey = PublicKey.fromString(publicKeyHex)
  const account = client.operatorPublicKey!.toEvmAddress() 
  // TODO - retrieve ECDSA or ED25519 from userAccountInfo on mirror node
  const sigObj = Buffer.from(buildSignatureMap(operatorPublicKey, Buffer.from(sigRawHex, 'hex'), 'ECDSA'))
  
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
	
  // // known params
  // const knownParams: Record<string, KnownParam> = {
  //   '0189c0a8-7e80-7e80-8000-000000000001': {
  //     txId: '2229c0a8-7e80-7e80-8000-000000000091',
  //     sig: '<TO BE CALCULATED>'
  //   },
  //   '0189c0a8-7e80-7e80-8000-000000000002': {
  //     txId: '2229c0a8-7e80-7e80-8000-000000000092',
  //     sig: '<TO BE CALCULATED>'
  //   },
  //   '0189c0a8-7e80-7e80-8000-000000000003': {
  //     txId: '2229c0a8-7e80-7e80-8000-000000000093',
  //     sig: '<TO BE CALCULATED>'
  //   }
  // }

  // for (const marketId in knownParams) {
  //   const knownParam = knownParams[marketId]
  //   console.log(marketId)
  //   console.log(knownParam.txId)
  //   // const packed = ethers.solidityPacked(['uint256', 'uint128', 'uint128'],[collateralUSDCbig, uuid7_to_uint128(marketId), uuid7_to_uint128(knownParam.txId)])
  //   console.log(uuid7_to_uint128(marketId).toString())
  //   console.log(collateralUSDCbig.toString())
  //   // console.log(Buffer.from(packed).toString('hex'))
  // }

  // process.exit(0)

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
    console.log(`Buying ${collateralUsdAbsScaled} position tokens (both buy and sell side) with ${collateralUsdAbsScaled} (USDC base units) as collateral (x2)...`)
    
    // 1. Approve the PredictionMarket contract to spend user's USDC collateral tokens (x2)
    const approveTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(netConf[networkSelected].usdcContractId).toEvmAddress())
      .setGas(10_000_000)
      .setFunction('approve', // approve inherited from ERC20 
        new ContractFunctionParameters()
          .addAddress(ContractId.fromString(contractId).toEvmAddress())
          .addUint256((collateralUsdAbsScaled * BigInt(2)).toString())) /** Note: x2 since buy side and sell side are from the same account...**/
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
        // bytes calldata sigObjYes,
        // bytes calldata sigObjNo
      .addUint128(marketId.toString()) // marketId
      .addAddress(account) // signerYes
      .addAddress(account) // signerNo // TODO - have a yes/no distinction
      .addUint256(collateralUsdAbsScaled.toString()) // collateralUsdAbsScaled
      .addUint128(txId.toString()) // txIdYes
      .addUint128(txId.toString())  // txIdNo // TODO - have a yes/no distinction
      .addBytes(sigObj) // sigObjYes
      .addBytes(sigObj) // sigObjNo // TODO - have a yes/no distinction
    const buyTx4 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(2_000_000) // approx 1 million per USDC transfer (two USDC transfers in the atomic function)
      .setFunction(
        'buyPositionTokensOnBehalfAtomic',
        params
      )
      .execute(client)

    const buyReceipt4 = await buyTx4.getReceipt(client)
    console.log(`buyPositionTokensOnBehalf(marketId=${marketId},...) status:`, buyReceipt4.status.toString())
 
 
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
