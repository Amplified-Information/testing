// Usage: `ts-node test2.ts`
import { AccountId, Client, ContractExecuteTransaction, ContractFunctionParameters, ContractId, PrivateKey, PublicKey } from '@hashgraph/sdk'
import assert from 'assert'
import { keccak256 } from 'ethers'
import { buildSignatureMap } from '../utils.ts' 

const contractId = '0.0.7388471'
const operatorId = AccountId.fromString('0.0.7090546')
const evmAddress = '440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6'
const privateKeyHex = '1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d'
const privateKey = PrivateKey.fromStringECDSA(privateKeyHex)
const publicKey = privateKey.publicKey
// const publicKeyHex = publicKey.toStringRaw()
const client = Client.forTestnet().setOperator(operatorId, privateKey)

/*
00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af83a8a7974ecaea255682ea385ba
Signer.tsx:225 packedKeccakHex: cb09968b7bbfdf738d9eb128ab7cf9aac3cc855287c4578410bbaaf373fb41cc
Signer.tsx:235 msgToSign (base64) (len=44): ywmWi3u/33ONnrEoq3z5qsPMhVKHxFeEELuq83P7Qcw=
Signer.tsx:236 packedKeccakHex (len=32): cb09968b7bbfdf738d9eb128ab7cf9aac3cc855287c4578410bbaaf373fb41cc
Signer.tsx:238 sigHex (len=64): 3e57400eac06b5de22413b5720f014e26b6392f1d0c286a4868086b8629241e42322ad35206229f8032344cf3987c619dd0cd5abd975ee002b1515f098907753
Signer.tsx:36 {"txId":"019af83a-8a79-74ec-aea2-55682ea385ba","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T09:52:57.465Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.012,"qty":83.33333333333333,"sig":"PldADqwGtd4iQTtXIPAU4mtjkvHQwoakhoCGuGKSQeQjIq01IGIp+AMjRM85h8YZ3QzVq9l17gArFRXwmJB3Uw=="}
*/
const verify_rawSig_hashpack_base64 = () => {
  console.log('--- verify_rawSig_hashpack_base64 ---')
  const payloadHex = '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af83a8a7974ecaea255682ea385ba'
  const sigHex = '3e57400eac06b5de22413b5720f014e26b6392f1d0c286a4868086b8629241e42322ad35206229f8032344cf3987c619dd0cd5abd975ee002b1515f098907753'

  const keccakHex = keccak256(Buffer.from(payloadHex, 'hex')).slice(2)
  const keccak = Buffer.from(keccakHex, 'hex')
  const keccak64 = keccak.toString('base64') // an extra step...
  const keccakPrefixedStr = prefixMessageToSign(keccak64)
  console.log(`keccakPrefixedStr (hex): ${Buffer.from(keccakPrefixedStr, 'utf-8').toString('hex')}`)
  
  const isVerifiedRaw = publicKey.verify(Buffer.from(keccakPrefixedStr, 'utf-8'), Buffer.from(sigHex, 'hex'))
  // console.log(`keccakPrefixedBytes (hex): ${Buffer.from(Buffer.from(keccakPrefixedStr, 'utf-8')).toString('hex')}`)
  console.log('---> isVerifiedRaw (should be true):', isVerifiedRaw)
  assert(isVerifiedRaw, 'Raw signature verification (verify_rawSig_hashpack_utf8) failed')
}

// /*
// 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af83a8a7974ecaea255682ea385ba
// "txId":"019af83a-8a79-74ec-aea2-55682ea385ba"
// "marketId":"0189c0a8-7e80-7e80-8000-000000000003"
// */
// const verify_assemblePayload_uft8HashpackSigned = async () => {
//   console.log('--- verify_assemblePayload ---')

//   const EXPECTED = '19486564657261205369676e6564204d6573736167653a0a343079776d576933752f33334f4e6e72456f71337a357173504d68564b4878466545454c7571383350375163773d'
//   // 40 - length of prefix input in Solidity function
//   const collateralUsdAbsScaled = BigInt('0x00000000000000000000000000000000000000000000000000000000000f4240')
//   const marketId = BigInt('0x0189c0a87e807e808000000000000003')
//   const txId = BigInt('0x019af83a8a7974ecaea255682ea385ba')

//   const params = new ContractFunctionParameters() // Sig.sol
//     // uint256 collateralUsd
//     // uint128 marketId
//     // uint128 txId
//     .addUint256(collateralUsdAbsScaled.toString())
//     .addUint128(marketId.toString())
//     .addUint128(txId.toString())
  
//   const tx = await new ContractExecuteTransaction()
//     .setContractId(ContractId.fromString(contractId))
//     .setGas(1_000_000)
//     .setFunction('assemblePayload', params)
//     .execute(client)
  
//   const record = await tx.getRecord(client)
//   const result = record.contractFunctionResult
//   if (result) {
//     console.log(`result: ${result.getResult(['bytes'])}`)
//     console.log('')
    
//     const [prefixedKeccak64Hex] = result.getResult(['bytes'])
//     console.log(`prefixedKeccak64 (hex): ${prefixedKeccak64Hex}`)

//     assert(prefixedKeccak64Hex.slice(2) === EXPECTED, 'assemblePayload result does not match expected value')
//     console.log('OK ✅')
//   } else {
//     console.error('No contract function result found.')
//   }
// }










function prefixMessageToSign(messageUtf8: string) {
  console.log(messageUtf8.length)
  return '\x19Hedera Signed Message:\n' + messageUtf8.length + messageUtf8
}

// function buildSignatureMap(publicKey: PublicKey, signature: Uint8Array) {
//   // const signature = privateKey.sign(message)
//   // console.log(`signature: ${Buffer.from(signature).toString('hex')}`)

//   const sigPair = proto.SignaturePair.create({
//     pubKeyPrefix: publicKey.toBytesRaw(),            // prefix = full key
//     ECDSASecp256k1: signature                        // OR ed25519 depending on key type
//   })

//   const sigMap = proto.SignatureMap.create({
//     sigPair: [sigPair]
//   })

//   const bytes = proto.SignatureMap.encode(sigMap).finish()
//   return bytes
// }




// 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af83a8a7974ecaea255682ea385ba
// Signer.tsx:225 packedKeccakHex: cb09968b7bbfdf738d9eb128ab7cf9aac3cc855287c4578410bbaaf373fb41cc
// Signer.tsx:235 msgToSign (base64) (len=44): ywmWi3u/33ONnrEoq3z5qsPMhVKHxFeEELuq83P7Qcw=
// Signer.tsx:236 packedKeccakHex (len=32): cb09968b7bbfdf738d9eb128ab7cf9aac3cc855287c4578410bbaaf373fb41cc
// Signer.tsx:238 sigHex (len=64): 3e57400eac06b5de22413b5720f014e26b6392f1d0c286a4868086b8629241e42322ad35206229f8032344cf3987c619dd0cd5abd975ee002b1515f098907753
// Signer.tsx:36 {"txId":"019af83a-8a79-74ec-aea2-55682ea385ba","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T09:52:57.465Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.012,"qty":83.33333333333333,"sig":"PldADqwGtd4iQTtXIPAU4mtjkvHQwoakhoCGuGKSQeQjIq01IGIp+AMjRM85h8YZ3QzVq9l17gArFRXwmJB3Uw=="}
const verifyAssembly = async (
  payloadHex = '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af83a8a7974ecaea255682ea385ba',
  sigHex = '3e57400eac06b5de22413b5720f014e26b6392f1d0c286a4868086b8629241e42322ad35206229f8032344cf3987c619dd0cd5abd975ee002b1515f098907753'
) => {
  console.log('--- verifyAssembly ---')

  /////
  // on-chain assembly
  /////
  const collateralUsdAbsScaled = BigInt('0x' + payloadHex.substring(0, 64))
  const marketId = BigInt('0x' + payloadHex.substring(64, 96))
  const txId = BigInt('0x' + payloadHex.substring(96, 128))

  const params = new ContractFunctionParameters() // Sig.sol
    // uint256 collateralUsd
    // uint128 marketId
    // uint128 txId
    .addUint256(collateralUsdAbsScaled.toString())
    .addUint128(marketId.toString())
    .addUint128(txId.toString())
  
  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(1_000_000)
    .setFunction('assemblePrismPayload', params)
    .execute(client)
  
  const record = await tx.getRecord(client)
  const result = record.contractFunctionResult
  
  console.log(`result: ${result!.getResult(['bytes'])}`)
  console.log('')
  
  const [returnParam0] = result!.getResult(['bytes'])
  const prefixedKeccak64Hex = returnParam0.toString().slice(2)
  console.log(`onChain:\t${prefixedKeccak64Hex}`)



  /////
  // off-chain assembly:
  /////
  
  const keccakHex = keccak256(Buffer.from(payloadHex, 'hex')).slice(2)
  const keccak = Buffer.from(keccakHex, 'hex')
  const keccak64 = keccak.toString('base64') // an extra step...
  const keccakPrefixedStr = prefixMessageToSign(keccak64)
  console.log(`offChain:\t${Buffer.from(keccakPrefixedStr, 'utf-8').toString('hex')}`)

  /////
  // verifiy sigs are correct - off-chain assembly and on-chain assembly
  /////
  const offChainOK = publicKey.verify(Buffer.from(keccakPrefixedStr, 'utf-8'), Buffer.from(sigHex, 'hex'))
  console.log(keccakPrefixedStr)
  console.log('---> publicKey.verify (assembled off-chain):', offChainOK)
  
  const keccakPrefixedStr2 = Buffer.from(prefixedKeccak64Hex, 'hex').toString('utf-8')
  const onChainOK = publicKey.verify(Buffer.from(keccakPrefixedStr2, 'utf-8'), Buffer.from(sigHex, 'hex'))
  console.log(keccakPrefixedStr2)
  console.log('---> publicKey.verify (assembled on-chain):', onChainOK)
  
  // if(onChainOK) {
  //   console.log('OK ✅')
  // } else {
  //   console.error('FAILED ❌. signature verification (verifyAssembly) failed')
  // }
}





interface Val {
  payloadHex: string
  sigHex: string
}
const testVals: Val[] = []

// Signing OrderIntent...
// Signer.tsx:222 x:  0x248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c
// Signer.tsx:225 packedKeccakHex: 248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
// Signer.tsx:235 msgToSign (base64) (len=44): JIxvDk0PVNvG45apwZKiK314/uueHUyoWzlQDZ6mx9U=
// Signer.tsx:236 packedKeccakHex (len=32): 248c6f0e4d0f54dbc6e396a9c192a22b7d78feeb9e1d4ca85b39500d9ea6c7d5
// Signer.tsx:238 sigHex (len=64): ae4cedbdd9b3dcd94ba8e0909f35bb93ff5bd8a15ef87d24f610802b756cc7363acafd3151d6c91182efe5cefe7d6e42d1a3568022e928f06012184fd7a2820b
// Signer.tsx:36 {"txId":"019af9dc-4e5f-7518-80af-b44d6938149c","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T17:29:16.127Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":0.0274,"sig":"rkztvdmz3NlLqOCQnzW7k/9b2KFe+H0k9hCAK3VsxzY6yv0xUdbJEYLv5c7+fW5C0aNWgCLpKPBgEhhP16KCCw=="}
testVals.push({
    payloadHex: '00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c',
    sigHex:     'ae4cedbdd9b3dcd94ba8e0909f35bb93ff5bd8a15ef87d24f610802b756cc7363acafd3151d6c91182efe5cefe7d6e42d1a3568022e928f06012184fd7a2820b'
})

// Signing OrderIntent...
// Signer.tsx:222 x:  0x4a3b24fd1a048039c3961a79bd42992295c70d81b100adca2b6b1331317e7b6e
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90f3f6473baaf96d1db9d868364
// Signer.tsx:225 packedKeccakHex: 4a3b24fd1a048039c3961a79bd42992295c70d81b100adca2b6b1331317e7b6e
// Signer.tsx:235 msgToSign (base64) (len=44): Sjsk/RoEgDnDlhp5vUKZIpXHDYGxAK3KK2sTMTF+e24=
// Signer.tsx:236 packedKeccakHex (len=32): 4a3b24fd1a048039c3961a79bd42992295c70d81b100adca2b6b1331317e7b6e
// Signer.tsx:238 sigHex (len=64): 28ae2364130db57cf3600697f58acd39be686689d68d0c9995af893db6294fe86baf2be813426caf82f684d353854dc7a074797f014959e6c0c2f96c8da320c7
// Signer.tsx:36 {"txId":"019af90f-3f64-73ba-af96-d1db9d868364","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:17.412Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"KK4jZBMNtXzzYAaX9YrNOb5oZonWjQyZla+JPbYpT+hrryvoE0Jsr4L2hNNThU3HoHR5fwFJWebAwvlsjaMgxw=="}
// Signer.tsx:36 {"txId":"019af90f-9249-767b-8c6a-933bff147377","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:38.633Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-9249-767b-8c6a-933bff147377","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:38.633Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-9249-767b-8c6a-933bff147377","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:38.633Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push({
    payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90f3f6473baaf96d1db9d868364',
    sigHex:     '28ae2364130db57cf3600697f58acd39be686689d68d0c9995af893db6294fe86baf2be813426caf82f684d353854dc7a074797f014959e6c0c2f96c8da320c7'
})
// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0xa34703e9396cfa7808e2b14dc8ed02d4cb36469bf3520b26bfb06790923608d4
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90f9249767b8c6a933bff147377
// Signer.tsx:225 packedKeccakHex: a34703e9396cfa7808e2b14dc8ed02d4cb36469bf3520b26bfb06790923608d4
// Signer.tsx:235 msgToSign (base64) (len=44): o0cD6Tls+ngI4rFNyO0C1Ms2RpvzUgsmv7BnkJI2CNQ=
// Signer.tsx:236 packedKeccakHex (len=32): a34703e9396cfa7808e2b14dc8ed02d4cb36469bf3520b26bfb06790923608d4
// Signer.tsx:238 sigHex (len=64): 55ab935372a6fd9a38190e1e5e626e256d308c93023a6ab5c0171fd7d00bef857534e6ef3ed7ac498b18fdec85242cfbc8c19d4da0afdb95987d36b6c592c404
// Signer.tsx:36 {"txId":"019af90f-9249-767b-8c6a-933bff147377","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:38.633Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"VauTU3Km/Zo4GQ4eXmJuJW0wjJMCOmq1wBcf19AL74V1NObvPtesSYsY/eyFJCz7yMGdTaCv25WYfTa2xZLEBA=="}
// Signer.tsx:36 {"txId":"019af90f-b64a-71a8-984d-f65bca651ce1","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:47.850Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-b64a-71a8-984d-f65bca651ce1","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:47.850Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-b64a-71a8-984d-f65bca651ce1","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:47.850Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90f9249767b8c6a933bff147377',
  sigHex:     '55ab935372a6fd9a38190e1e5e626e256d308c93023a6ab5c0171fd7d00bef857534e6ef3ed7ac498b18fdec85242cfbc8c19d4da0afdb95987d36b6c592c404'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x7873771abd266c52f7899cb1d49c1df2268cfe7adeda5e12c67cc8a41b12cf1a
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90fb64a71a8984df65bca651ce1
// Signer.tsx:225 packedKeccakHex: 7873771abd266c52f7899cb1d49c1df2268cfe7adeda5e12c67cc8a41b12cf1a
// Signer.tsx:235 msgToSign (base64) (len=44): eHN3Gr0mbFL3iZyx1Jwd8iaM/nre2l4SxnzIpBsSzxo=
// Signer.tsx:236 packedKeccakHex (len=32): 7873771abd266c52f7899cb1d49c1df2268cfe7adeda5e12c67cc8a41b12cf1a
// Signer.tsx:238 sigHex (len=64): 8bf2a0480dab52a5ca49a478f94e31744ee3986ef8867076ce229cecc9c96ade14427af2bc225cc25a72caf65b7ee9b75d826a4c4bcadd5ac8f76281f1936921
// Signer.tsx:36 {"txId":"019af90f-b64a-71a8-984d-f65bca651ce1","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:47.850Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"i/KgSA2rUqXKSaR4+U4xdE7jmG74hnB2ziKc7MnJat4UQnryvCJcwlpyyvZbfum3XYJqTEvK3VrI92KB8ZNpIQ=="}
// Signer.tsx:36 {"txId":"019af90f-dc87-74ab-b6c9-cebeffd60867","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:57.640Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-dc87-74ab-b6c9-cebeffd60867","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:57.640Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-dc87-74ab-b6c9-cebeffd60867","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:57.640Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90fb64a71a8984df65bca651ce1',
  sigHex:     '8bf2a0480dab52a5ca49a478f94e31744ee3986ef8867076ce229cecc9c96ade14427af2bc225cc25a72caf65b7ee9b75d826a4c4bcadd5ac8f76281f1936921'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0xce727be065c892c03c98f06b4e751cc55b0f98f55d60e514e4b1fb4698462efd
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90fdc8774abb6c9cebeffd60867
// Signer.tsx:225 packedKeccakHex: ce727be065c892c03c98f06b4e751cc55b0f98f55d60e514e4b1fb4698462efd
// Signer.tsx:235 msgToSign (base64) (len=44): znJ74GXIksA8mPBrTnUcxVsPmPVdYOUU5LH7RphGLv0=
// Signer.tsx:236 packedKeccakHex (len=32): ce727be065c892c03c98f06b4e751cc55b0f98f55d60e514e4b1fb4698462efd
// Signer.tsx:238 sigHex (len=64): e6dd490b16f54147910bf1d1b9c775bc7140b53cf5243bf362e410ae3b62aad83c99b9040e0b5706f1eeb99afcf01ce88c273bada9e952dcc310a770f3fafffc
// Signer.tsx:36 {"txId":"019af90f-dc87-74ab-b6c9-cebeffd60867","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:45:57.640Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"5t1JCxb1QUeRC/HRucd1vHFAtTz1JDvzYuQQrjtiqtg8mbkEDgtXBvHuuZr88BzojCc7ranpUtzDEKdw8/r//A=="}
// Signer.tsx:36 {"txId":"019af90f-f4f8-7285-bb31-cfc6cbc8ecb0","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:03.896Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-f4f8-7285-bb31-cfc6cbc8ecb0","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:03.896Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af90f-f4f8-7285-bb31-cfc6cbc8ecb0","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:03.896Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
// Signer.tsx:36 {"txId":"019af910-09aa-7131-9fde-2d006fa88b17","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:09.194Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-09aa-7131-9fde-2d006fa88b17","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:09.194Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-09aa-7131-9fde-2d006fa88b17","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:09.194Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af90fdc8774abb6c9cebeffd60867',
  sigHex:     'e6dd490b16f54147910bf1d1b9c775bc7140b53cf5243bf362e410ae3b62aad83c99b9040e0b5706f1eeb99afcf01ce88c273bada9e952dcc310a770f3fafffc'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x62faa91e4d342b4cb8bfb8e40bebac2b5a8400e82f9f9c8992aad07d5317696f
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91009aa71319fde2d006fa88b17
// Signer.tsx:225 packedKeccakHex: 62faa91e4d342b4cb8bfb8e40bebac2b5a8400e82f9f9c8992aad07d5317696f
// Signer.tsx:235 msgToSign (base64) (len=44): YvqpHk00K0y4v7jkC+usK1qEAOgvn5yJkqrQfVMXaW8=
// Signer.tsx:236 packedKeccakHex (len=32): 62faa91e4d342b4cb8bfb8e40bebac2b5a8400e82f9f9c8992aad07d5317696f
// Signer.tsx:238 sigHex (len=64): 14f604acd9af9c83d0ce41ca4e3d48b1cb4cb2884a878cec2432e3ddb8c719c769ce32db1a730d96362a89d53103a54cae547d77f54b2f9150c262377678f53e
// Signer.tsx:36 {"txId":"019af910-09aa-7131-9fde-2d006fa88b17","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:09.194Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"FPYErNmvnIPQzkHKTj1IsctMsohKh4zsJDLj3bjHGcdpzjLbGnMNljYqidUxA6VMrlR9d/VLL5FQwmI3dnj1Pg=="}
// Signer.tsx:36 {"txId":"019af910-2415-779a-8715-90bc0922a71b","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:15.957Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-2415-779a-8715-90bc0922a71b","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:15.957Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-2415-779a-8715-90bc0922a71b","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:15.957Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91009aa71319fde2d006fa88b17',
  sigHex:     '14f604acd9af9c83d0ce41ca4e3d48b1cb4cb2884a878cec2432e3ddb8c719c769ce32db1a730d96362a89d53103a54cae547d77f54b2f9150c262377678f53e'
})


// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0xa1d5c1a5d1cb2dd6839c4dd8bb27efaedd4651aecd08b092a13ba652994a66e1
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af9102415779a871590bc0922a71b
// Signer.tsx:225 packedKeccakHex: a1d5c1a5d1cb2dd6839c4dd8bb27efaedd4651aecd08b092a13ba652994a66e1
// Signer.tsx:235 msgToSign (base64) (len=44): odXBpdHLLdaDnE3Yuyfvrt1GUa7NCLCSoTumUplKZuE=
// Signer.tsx:236 packedKeccakHex (len=32): a1d5c1a5d1cb2dd6839c4dd8bb27efaedd4651aecd08b092a13ba652994a66e1
// Signer.tsx:238 sigHex (len=64): 5bfabea01e3d679e72c90a487bdb454c4e9a89f0db18d5f9e814083c04abbff200d81cd6b6bfbff5523c8e8d82cc71e5abd56504414a077941278d848ce3df7f
// Signer.tsx:36 {"txId":"019af910-2415-779a-8715-90bc0922a71b","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:15.957Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"W/q+oB49Z55yyQpIe9tFTE6aifDbGNX56BQIPASrv/IA2BzWtr+/9VI8jo2CzHHlq9VlBEFKB3lBJ42EjOPffw=="}
// Signer.tsx:36 {"txId":"019af910-3d02-757b-b8fc-5d99800d679f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:22.338Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-3d02-757b-b8fc-5d99800d679f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:22.338Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-3d02-757b-b8fc-5d99800d679f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:22.338Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af9102415779a871590bc0922a71b',
  sigHex:     '5bfabea01e3d679e72c90a487bdb454c4e9a89f0db18d5f9e814083c04abbff200d81cd6b6bfbff5523c8e8d82cc71e5abd56504414a077941278d848ce3df7f'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x24e1cc8d893aef219b9efc8fc879849926fec0b54fcc6faf0cd7fbec5ab226b6
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af9103d02757bb8fc5d99800d679f
// Signer.tsx:225 packedKeccakHex: 24e1cc8d893aef219b9efc8fc879849926fec0b54fcc6faf0cd7fbec5ab226b6
// Signer.tsx:235 msgToSign (base64) (len=44): JOHMjYk67yGbnvyPyHmEmSb+wLVPzG+vDNf77FqyJrY=
// Signer.tsx:236 packedKeccakHex (len=32): 24e1cc8d893aef219b9efc8fc879849926fec0b54fcc6faf0cd7fbec5ab226b6
// Signer.tsx:238 sigHex (len=64): 1f08ca6d7dd8b7a20ed7a697a97286d49e3012ad3051e75c138db4cd61eb4d2b59b99a7514a8f383a6ad48a81b8c29f8ee9495003f5a170a8f641094633ae203
// Signer.tsx:36 {"txId":"019af910-3d02-757b-b8fc-5d99800d679f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:22.338Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"HwjKbX3Yt6IO16aXqXKG1J4wEq0wUedcE420zWHrTStZuZp1FKjzg6atSKgbjCn47pSVAD9aFwqPZBCUYzriAw=="}
// Signer.tsx:36 {"txId":"019af910-58ad-7657-b482-9ff2d9b8e2d9","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:29.421Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-58ad-7657-b482-9ff2d9b8e2d9","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:29.421Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-58ad-7657-b482-9ff2d9b8e2d9","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:29.421Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af9103d02757bb8fc5d99800d679f',
  sigHex:     '1f08ca6d7dd8b7a20ed7a697a97286d49e3012ad3051e75c138db4cd61eb4d2b59b99a7514a8f383a6ad48a81b8c29f8ee9495003f5a170a8f641094633ae203'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x053b2b4a83120c18819215dd172d5ccd7a96349625319d13a72d5aa5017ebcc9
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91058ad7657b4829ff2d9b8e2d9
// Signer.tsx:225 packedKeccakHex: 053b2b4a83120c18819215dd172d5ccd7a96349625319d13a72d5aa5017ebcc9
// Signer.tsx:235 msgToSign (base64) (len=44): BTsrSoMSDBiBkhXdFy1czXqWNJYlMZ0Tpy1apQF+vMk=
// Signer.tsx:236 packedKeccakHex (len=32): 053b2b4a83120c18819215dd172d5ccd7a96349625319d13a72d5aa5017ebcc9
// Signer.tsx:238 sigHex (len=64): ee2803d010bed45f3d45670a1fec68b2e25e68f2f5b2a5fd6e46fe13521715f25acd55f4e7fa8c92ad097c15466d0a4464ff7bf7b7c40db6e53b6103822277b5
// Signer.tsx:36 {"txId":"019af910-58ad-7657-b482-9ff2d9b8e2d9","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:29.421Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"7igD0BC+1F89RWcKH+xosuJeaPL1sqX9bkb+E1IXFfJazVX05/qMkq0JfBVGbQpEZP9797fEDbblO2EDgiJ3tQ=="}
// Signer.tsx:36 {"txId":"019af910-6ffa-72a6-a90f-961e2f827f44","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:35.386Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-72ab-7662-bff0-96d00966e58f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:36.075Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-72ab-7662-bff0-96d00966e58f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:36.075Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-72ab-7662-bff0-96d00966e58f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:36.075Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91058ad7657b4829ff2d9b8e2d9',
  sigHex:     'ee2803d010bed45f3d45670a1fec68b2e25e68f2f5b2a5fd6e46fe13521715f25acd55f4e7fa8c92ad097c15466d0a4464ff7bf7b7c40db6e53b6103822277b5'
})


// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x8d8cf00bd88188ae2112a6db2b5e3711adde1ec246be6589065757f4eb28046a
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91072ab7662bff096d00966e58f
// Signer.tsx:225 packedKeccakHex: 8d8cf00bd88188ae2112a6db2b5e3711adde1ec246be6589065757f4eb28046a
// Signer.tsx:235 msgToSign (base64) (len=44): jYzwC9iBiK4hEqbbK143Ea3eHsJGvmWJBldX9OsoBGo=
// Signer.tsx:236 packedKeccakHex (len=32): 8d8cf00bd88188ae2112a6db2b5e3711adde1ec246be6589065757f4eb28046a
// Signer.tsx:238 sigHex (len=64): 6ad4721ea9122b798131968c1871d45da9c3acdd3eb71c2f381bd0d6cc6b15266455ec557c957f1d4c6a3d2de8150792fc9e9a60d3f74ae5f6a8b99622d681e2
// Signer.tsx:36 {"txId":"019af910-72ab-7662-bff0-96d00966e58f","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:36.075Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"atRyHqkSK3mBMZaMGHHUXanDrN0+txwvOBvQ1sxrFSZkVexVfJV/HUxqPS3oFQeS/J6aYNP3SuX2qLmWItaB4g=="}
// Signer.tsx:36 {"txId":"019af910-93b9-77c1-8a4c-60a170e8c060","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:44.537Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-93b9-77c1-8a4c-60a170e8c060","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:44.537Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-93b9-77c1-8a4c-60a170e8c060","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:44.537Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91072ab7662bff096d00966e58f',
  sigHex:     '6ad4721ea9122b798131968c1871d45da9c3acdd3eb71c2f381bd0d6cc6b15266455ec557c957f1d4c6a3d2de8150792fc9e9a60d3f74ae5f6a8b99622d681e2'
})


// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x30834f88de3d6a89e00dfdcc1b4c128f34dc8535d765fcf99fb1c184e19c4030
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91093b977c18a4c60a170e8c060
// Signer.tsx:225 packedKeccakHex: 30834f88de3d6a89e00dfdcc1b4c128f34dc8535d765fcf99fb1c184e19c4030
// Signer.tsx:235 msgToSign (base64) (len=44): MINPiN49aongDf3MG0wSjzTchTXXZfz5n7HBhOGcQDA=
// Signer.tsx:236 packedKeccakHex (len=32): 30834f88de3d6a89e00dfdcc1b4c128f34dc8535d765fcf99fb1c184e19c4030
// Signer.tsx:238 sigHex (len=64): cc760ac6f1ff1fba2a7e03679262c88b3afd5c8a1c40a5f7a3d859538d21be852c15ed9ee7ab0915e88fea7b5c9a33bd8a47c5cc3bd34492d5573ef4d3484306
// Signer.tsx:36 {"txId":"019af910-93b9-77c1-8a4c-60a170e8c060","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:44.537Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"zHYKxvH/H7oqfgNnkmLIizr9XIocQKX3o9hZU40hvoUsFe2e56sJFeiP6ntcmjO9ikfFzDvTRJLVVz7000hDBg=="}
// Signer.tsx:36 {"txId":"019af910-b215-767c-9e76-b87640d04578","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:52.309Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-b215-767c-9e76-b87640d04578","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:52.309Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-b215-767c-9e76-b87640d04578","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:52.309Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af91093b977c18a4c60a170e8c060',
  sigHex:     'cc760ac6f1ff1fba2a7e03679262c88b3afd5c8a1c40a5f7a3d859538d21be852c15ed9ee7ab0915e88fea7b5c9a33bd8a47c5cc3bd34492d5573ef4d3484306'
})


// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0xe18b3124f1691e62c01a67545eeb2ee5d97860afc0e23301bcb47b2196304bd4
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910b215767c9e76b87640d04578
// Signer.tsx:225 packedKeccakHex: e18b3124f1691e62c01a67545eeb2ee5d97860afc0e23301bcb47b2196304bd4
// Signer.tsx:235 msgToSign (base64) (len=44): 4YsxJPFpHmLAGmdUXusu5dl4YK/A4jMBvLR7IZYwS9Q=
// Signer.tsx:236 packedKeccakHex (len=32): e18b3124f1691e62c01a67545eeb2ee5d97860afc0e23301bcb47b2196304bd4
// Signer.tsx:238 sigHex (len=64): 720d17f19809a9d088d8ede89f169ab7f9df414c01cb32de40bfa2037de2faae27f0f74c14ac7ca29bfe288757c9ee9a86961f4b96daea11a3e6b2854b4d974e
// Signer.tsx:36 {"txId":"019af910-b215-767c-9e76-b87640d04578","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:52.309Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"cg0X8ZgJqdCI2O3onxaat/nfQUwByzLeQL+iA33i+q4n8PdMFKx8opv+KIdXye6ahpYfS5ba6hGj5rKFS02XTg=="}
// Signer.tsx:36 {"txId":"019af910-cf4b-73f8-9595-afc490f533f4","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:59.787Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-cf4b-73f8-9595-afc490f533f4","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:59.787Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-cf4b-73f8-9595-afc490f533f4","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:59.787Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910b215767c9e76b87640d04578',
  sigHex:     '720d17f19809a9d088d8ede89f169ab7f9df414c01cb32de40bfa2037de2faae27f0f74c14ac7ca29bfe288757c9ee9a86961f4b96daea11a3e6b2854b4d974e'
})


// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x98b4ce752d4e72016ab5f9e83532a7ca3b13dbb6efdab57c61038fa481b81697
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910cf4b73f89595afc490f533f4
// Signer.tsx:225 packedKeccakHex: 98b4ce752d4e72016ab5f9e83532a7ca3b13dbb6efdab57c61038fa481b81697
// Signer.tsx:235 msgToSign (base64) (len=44): mLTOdS1OcgFqtfnoNTKnyjsT27bv2rV8YQOPpIG4Fpc=
// Signer.tsx:236 packedKeccakHex (len=32): 98b4ce752d4e72016ab5f9e83532a7ca3b13dbb6efdab57c61038fa481b81697
// Signer.tsx:238 sigHex (len=64): 3e69d5e398d52676cc4f60f3b2ff46f1a1948224c7ff9af7267a3bf46f8d6c432d38590671234d32b34dedb7f4e4ab457dbe8052d96d3101ba2b227e67a6e642
// Signer.tsx:36 {"txId":"019af910-cf4b-73f8-9595-afc490f533f4","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:46:59.787Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"PmnV45jVJnbMT2Dzsv9G8aGUgiTH/5r3Jno79G+NbEMtOFkGcSNNMrNN7bf05KtFfb6AUtltMQG6KyJ+Z6bmQg=="}
// Signer.tsx:36 {"txId":"019af910-e8c0-7263-a831-8d4a64efc447","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:47:06.304Z","accountId":"0.0.1","marketLimit":"limit","priceUsd":0.5,"qty":0,"sig":""}
// Signer.tsx:36 {"txId":"019af910-e8c0-7263-a831-8d4a64efc447","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:47:06.304Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":""}
// Signer.tsx:36 {"txId":"019af910-e8c0-7263-a831-8d4a64efc447","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:47:06.304Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":""}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910cf4b73f89595afc490f533f4',
  sigHex:     '3e69d5e398d52676cc4f60f3b2ff46f1a1948224c7ff9af7267a3bf46f8d6c432d38590671234d32b34dedb7f4e4ab457dbe8052d96d3101ba2b227e67a6e642'
})

// Signer.tsx:202 Signing OrderIntent...
// Signer.tsx:222 x:  0x0df0fdcf46b4d8470c42bd885690b55b970a5c8ae207de9c2d32eef65f82c1ae
// Signer.tsx:223 00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910e8c07263a8318d4a64efc447
// Signer.tsx:225 packedKeccakHex: 0df0fdcf46b4d8470c42bd885690b55b970a5c8ae207de9c2d32eef65f82c1ae
// Signer.tsx:235 msgToSign (base64) (len=44): DfD9z0a02EcMQr2IVpC1W5cKXIriB96cLTLu9l+Cwa4=
// Signer.tsx:236 packedKeccakHex (len=32): 0df0fdcf46b4d8470c42bd885690b55b970a5c8ae207de9c2d32eef65f82c1ae
// Signer.tsx:238 sigHex (len=64): 4c35980647296774c285df23ea56cc18faca29824d41b5b65fcea56f5f62e2e83e5b700bd057840cb311e32dcab3fc661505c33c1b4f48caa99992f025a81b41
// Signer.tsx:36 {"txId":"019af910-e8c0-7263-a831-8d4a64efc447","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-07T13:47:06.304Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.01,"qty":100,"sig":"TDWYBkcpZ3TChd8j6lbMGPrKKYJNQbW2X86lb19i4ug+W3AL0FeEDLMR4y3Ks/xmFQXDPBtPSMqpmZLwJagbQQ=="}
testVals.push( {
  payloadHex: '00000000000000000000000000000000000000000000000000000000000f42400189c0a87e807e808000000000000003019af910e8c07263a8318d4a64efc447',
  sigHex:     '4c35980647296774c285df23ea56cc18faca29824d41b5b65fcea56f5f62e2e83e5b700bd057840cb311e32dcab3fc661505c33c1b4f48caa99992f025a81b41'
})



const checkSig_onChain = async (publicKey: PublicKey, payloadHex: string, sigHex: string) => {
  console.log('--- checkSig_onChain ---')

  const keccakHex = keccak256(Buffer.from(payloadHex, 'hex')).slice(2)
  const keccak = Buffer.from(keccakHex, 'hex')
  // keccak[0] = keccak[0] ^ 0xff // Slightly perturb the first byte
  const keccak64 = keccak.toString('base64') ///// N.B. an extra base64 step...
  const keccakPrefixedStr = prefixMessageToSign(keccak64)
  console.log(`keccakPrefixedStr (hex): ${Buffer.from(keccakPrefixedStr, 'utf-8').toString('hex')}`)

  const sigObj = buildSignatureMap(publicKey, Buffer.from(sigHex, 'hex'), 'ECDSA') // TODO - retrieve key type (ECDSA or ED25519) from userAccountInfo on mirror node
  console.log(`sigObj (len=${sigObj.length}): ${Buffer.from(sigObj).toString('hex')}`)

  const params = new ContractFunctionParameters() // Sig.sol
    // address account
    // bytes memory message
    // bytes memory signature
    .addAddress(evmAddress)
    .addBytes(Buffer.from(keccakPrefixedStr, 'utf-8')) // Buffer.from('INCORRECT'))
    .addBytes(sigObj)
  
  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(1_000_000)
    .setFunction('isAuthorizedPublic', params)
    .execute(client)
  
  const record = await tx.getRecord(client)
  const result = record.contractFunctionResult
  if (result) {
    console.log(`result: ${result.getResult(['int64', 'bool'])}`)
  } else {
    console.error('No contract function result found.')
  }
}

;(async () => {
  let payloadHex = ''
  let sigHex = ''

  // await verifyAssembly(
  //   '00000000000000000000000000000000000000000000000000000000000035840189c0a87e807e808000000000000003019af9dc4e5f751880afb44d6938149c',
  //   'ae4cedbdd9b3dcd94ba8e0909f35bb93ff5bd8a15ef87d24f610802b756cc7363acafd3151d6c91182efe5cefe7d6e42d1a3568022e928f06012184fd7a2820b'
  // )
  // process.exit(0)

  await checkSig_onChain(publicKey, testVals[0].payloadHex, testVals[0].sigHex)
  console.log('************************************************')
  
  // process.exit(0)

  verify_rawSig_hashpack_base64()
  console.log('************************************************')

  // await verify_assemblePayload_uft8HashpackSigned()
  // console.log('************************************************')

  await verifyAssembly()
  console.log('************************************************')

  // process.exit(0)

  for (const tv of testVals) {
    payloadHex = tv.payloadHex
    sigHex = tv.sigHex
    await verifyAssembly(payloadHex, sigHex)
    console.log('************************************************')
    // process.exit(0)
  }

  process.exit(0) // needed at the end
})()