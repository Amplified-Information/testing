// Usage: `ts-node test2.ts`
import { AccountId, Client, ContractExecuteTransaction, ContractFunctionParameters, ContractId, PrivateKey, PublicKey } from '@hashgraph/sdk'
import assert from 'assert'
import { keccak256 } from 'ethers'
import { buildSignatureMap, prefixMessageToSign } from '../lib/utils.ts' 
import { payloadHex2components } from '../lib/utils.ts'

const contractId = '0.0.7508474'
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










// function prefixMessageToSign(messageUtf8: string) {
//   console.log(messageUtf8.length)
//   return '\x19Hedera Signed Message:\n' + messageUtf8.length + messageUtf8
// }

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




const verifyAssembly = async (payloadHex: string, sigHex: string) => {
  console.log('--- verifyAssembly ---')
  /////
  // on-chain assembly
  /////
  const [buySell, collateralUsdAbsScaled, evmAddr, marketId, txId] = payloadHex2components(payloadHex)

  // console.log(buySell)
  // console.log(collateralUsdAbsScaled.toString(16))
  // console.log(evmAddr.toString())
  // console.log(marketId.toString(16))
  // console.log(txId.toString(16))

  const params = new ContractFunctionParameters() // Test.sol
    .addBool(buySell)
    .addUint256(collateralUsdAbsScaled.toString())
    .addAddress(evmAddr)
    .addUint128(marketId.toString())
    .addUint128(txId.toString())
  
  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(5_000_000)
    .setFunction('assemblePayload', params)
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
  
  if(onChainOK) {
    console.log('OK ✅')
  } else {
    console.error('FAILED ❌. signature verification (verifyAssembly) failed')
  }
}





interface Val {
  payloadHex: string
  sigHex: string
}
const testVals: Val[] = []


// Signing OrderIntent...
// Signer.tsx:229 packedHex: 0000000000000000000000000000000000000000000000000000000000000f4240440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b47ae68cd7586abcd2a72aa54e746
// Signer.tsx:231 packedKeccakHex (len=32): 4e565e3f7c1da8c0d139e196c36dff70db9548d559ab1db349616dc8c91ea3d5
// Signer.tsx:232 verify at: https://emn178.github.io/online-tools/keccak_256.html
// Signer.tsx:251 msgToSign (base64) (len=44): TlZeP3wdqMDROeGWw23/cNuVSNVZqx2zSWFtyMkeo9U=
// Signer.tsx:254 sig (hex) (len=64): 93ff91d8c5dcd9599fe114c53c0bf9507aae9b8e51b405c504b43b091d4b367c7cfaec86d4d45a19bd0a421a88bc46b7f8d95da65797444edfb276d13ad43166
// Signer.tsx:255 sig (base64): k/+R2MXc2Vmf4RTFPAv5UHqum45RtAXFBLQ7CR1LNnx8+uyG1NRaGb0KQhqIvEa3+NldpleXRE7fsnbROtQxZg==
// Signer.tsx:32 {"txId":"019b47ae-68cd-7586-abcd-2a72aa54e746","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-22T20:09:31.085Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":"k/+R2MXc2Vmf4RTFPAv5UHqum45RtAXFBLQ7CR1LNnx8+uyG1NRaGb0KQhqIvEa3+NldpleXRE7fsnbROtQxZg==","publicKey":"03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787","evmAddress":"440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6","keyType":2}
testVals.push({
  payloadHex: '0000000000000000000000000000000000000000000000000000000000000f4240440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b47ae68cd7586abcd2a72aa54e746',
  sigHex:     '93ff91d8c5dcd9599fe114c53c0bf9507aae9b8e51b405c504b43b091d4b367c7cfaec86d4d45a19bd0a421a88bc46b7f8d95da65797444edfb276d13ad43166'
})

// Signing OrderIntent...
// Signer.tsx:229 packedHex: 0000000000000000000000000000000000000000000000000000000000000f4240440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46a783ee743fb7e570810b5a5915
// Signer.tsx:231 packedKeccakHex (len=32): 7c0f6d72d9a4b543da63fc6b2c6703a955e166e7c93862c41a763a50abb736a8
// Signer.tsx:232 verify at: https://emn178.github.io/online-tools/keccak_256.html
// Signer.tsx:251 msgToSign (base64) (len=44): fA9tctmktUPaY/xrLGcDqVXhZufJOGLEGnY6UKu3Nqg=
// Signer.tsx:254 sig (hex) (len=64): 5316a0d86b39fc7f1021c2bf0721b9d0d4158eea7c783d44455f03cdc6851f51648f41ed615894587607649a236d1cde7dd14cad230b8a5e0e7bf37930b0ff2a
// Signer.tsx:255 sig (base64): Uxag2Gs5/H8QIcK/ByG50NQVjup8eD1ERV8DzcaFH1Fkj0HtYViUWHYHZJojbRzefdFMrSMLil4Oe/N5MLD/Kg==
// Signer.tsx:32 {"txId":"019b46a7-83ee-743f-b7e5-70810b5a5915","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-22T15:22:22.062Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.5,"qty":2,"sig":"Uxag2Gs5/H8QIcK/ByG50NQVjup8eD1ERV8DzcaFH1Fkj0HtYViUWHYHZJojbRzefdFMrSMLil4Oe/N5MLD/Kg==","publicKey":"03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787","evmAddress":"440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6","keyType":2}
testVals.push({
    payloadHex: '0000000000000000000000000000000000000000000000000000000000000f4240440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46a783ee743fb7e570810b5a5915',
    sigHex:     '5316a0d86b39fc7f1021c2bf0721b9d0d4158eea7c783d44455f03cdc6851f51648f41ed615894587607649a236d1cde7dd14cad230b8a5e0e7bf37930b0ff2a'
})

// Signing OrderIntent...
// Signer.tsx:229 packedHex: 010000000000000000000000000000000000000000000000000000000000029810440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ac7df373bd892e099e671df507
// Signer.tsx:231 packedKeccakHex (len=32): b2fad4b83a99d0081682e6735f7b0285c69afb3017c25b54b5f261042e234a8d
// Signer.tsx:232 verify at: https://emn178.github.io/online-tools/keccak_256.html
// Signer.tsx:251 msgToSign (base64) (len=44): svrUuDqZ0AgWguZzX3sChcaa+zAXwltUtfJhBC4jSo0=
// Signer.tsx:254 sig (hex) (len=64): 3336e69cd00631f42a31d8fe27b164bd2ef45057a31f57b6930da352b299a5c329c36e8d93a6c624207ba275dda4204e2e8f0aea127c9f7afbefcd86291bf05b
// Signer.tsx:255 sig (base64): MzbmnNAGMfQqMdj+J7FkvS70UFejH1e2kw2jUrKZpcMpw26Nk6bGJCB7onXdpCBOLo8K6hJ8n3r7782GKRvwWw==
// Signer.tsx:32 {"txId":"019b46ac-7df3-73bd-892e-099e671df507","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-22T15:27:48.211Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":-0.5,"qty":0.34,"sig":"MzbmnNAGMfQqMdj+J7FkvS70UFejH1e2kw2jUrKZpcMpw26Nk6bGJCB7onXdpCBOLo8K6hJ8n3r7782GKRvwWw==","publicKey":"03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787","evmAddress":"440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6","keyType":2}
testVals.push({
    payloadHex: '010000000000000000000000000000000000000000000000000000000000029810440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ac7df373bd892e099e671df507',
    sigHex:     '3336e69cd00631f42a31d8fe27b164bd2ef45057a31f57b6930da352b299a5c329c36e8d93a6c624207ba275dda4204e2e8f0aea127c9f7afbefcd86291bf05b'
})

// Signing OrderIntent...
// Signer.tsx:229 packedHex: 0100000000000000000000000000000000000000000000000000000000003d0900440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ad5372722d8ab290b9df52ac31
// Signer.tsx:231 packedKeccakHex (len=32): f5c6d124327d2b0f4490b0951589cf8c6cd2cc0ba9ba654c5499c8afab2a85ca
// Signer.tsx:232 verify at: https://emn178.github.io/online-tools/keccak_256.html
// Signer.tsx:251 msgToSign (base64) (len=44): 9cbRJDJ9Kw9EkLCVFYnPjGzSzAupumVMVJnIr6sqhco=
// Signer.tsx:254 sig (hex) (len=64): 0f283ef329587e39a88a5d4f6beb100fbf840cb04cc108370810c41dc98176e55f89fc6669158aa44132ea460a389100018a8f7a1686cf9d158f41d68fc2226b
// Signer.tsx:255 sig (base64): Dyg+8ylYfjmoil1Pa+sQD7+EDLBMwQg3CBDEHcmBduVfifxmaRWKpEEy6kYKOJEAAYqPehaGz50Vj0HWj8Iiaw==
// Signer.tsx:32 {"txId":"019b46ad-5372-722d-8ab2-90b9df52ac31","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-22T15:28:42.866Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":-0.5,"qty":8,"sig":"Dyg+8ylYfjmoil1Pa+sQD7+EDLBMwQg3CBDEHcmBduVfifxmaRWKpEEy6kYKOJEAAYqPehaGz50Vj0HWj8Iiaw==","publicKey":"03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787","evmAddress":"440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6","keyType":2}
testVals.push( {
  payloadHex: '0100000000000000000000000000000000000000000000000000000000003d0900440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ad5372722d8ab290b9df52ac31',
  sigHex:     '0f283ef329587e39a88a5d4f6beb100fbf840cb04cc108370810c41dc98176e55f89fc6669158aa44132ea460a389100018a8f7a1686cf9d158f41d68fc2226b'
})

// Signing OrderIntent...
// Signer.tsx:229 packedHex: 000000000000000000000000000000000000000000000000000000000000000078440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ad5372722d8ab290b9df52ac31
// Signer.tsx:231 packedKeccakHex (len=32): e1459b6bbd68f171f2ffeed65c06dea21457a9623759516ed6b7991b0df5d2aa
// Signer.tsx:232 verify at: https://emn178.github.io/online-tools/keccak_256.html
// Signer.tsx:251 msgToSign (base64) (len=44): 4UWba71o8XHy/+7WXAbeohRXqWI3WVFu1reZGw310qo=
// Signer.tsx:254 sig (hex) (len=64): 62f147014b94d2cfeecbd8d0e2fa0196e784e2b667b6949ff9b3cbc2181c57244aca3b6f16d5b76203353cb47fad44d69fc329ca864977b0483b44437d953b58
// Signer.tsx:255 sig (base64): YvFHAUuU0s/uy9jQ4voBlueE4rZntpSf+bPLwhgcVyRKyjtvFtW3YgM1PLR/rUTWn8MpyoZJd7BIO0RDfZU7WA==
// Signer.tsx:32 {"txId":"019b46ad-5372-722d-8ab2-90b9df52ac31","net":"testnet","marketId":"0189c0a8-7e80-7e80-8000-000000000003","generatedAt":"2025-12-22T15:28:42.866Z","accountId":"0.0.7090546","marketLimit":"limit","priceUsd":0.32,"qty":0.000375,"sig":"YvFHAUuU0s/uy9jQ4voBlueE4rZntpSf+bPLwhgcVyRKyjtvFtW3YgM1PLR/rUTWn8MpyoZJd7BIO0RDfZU7WA==","publicKey":"03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787","evmAddress":"440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6","keyType":2}
testVals.push( {
  payloadHex: '000000000000000000000000000000000000000000000000000000000000000078440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b46ad5372722d8ab290b9df52ac31',
  sigHex:     '62f147014b94d2cfeecbd8d0e2fa0196e784e2b667b6949ff9b3cbc2181c57244aca3b6f16d5b76203353cb47fad44d69fc329ca864977b0483b44437d953b58'
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
    const statusCode = result.getInt64(0)
    const isAuthzd = result.getBool(1)
    console.log(`statusCode: ${statusCode}, isAuthzd: ${isAuthzd}`, isAuthzd ? '✅' : '❌')
    // console.log(`result: ${result.getResult(['int64', 'bool'])}`)
  } else {
    console.error('No contract function result found.')
  }
}

;(async () => {
  let payloadHex = ''
  let sigHex = ''

  await verifyAssembly(
    '0000000000000000000000000000000000000000000000000000000000000f4240440a1d7af93b92920bce50b4c0d2a8e6dcfebfd60189c0a87e807e808000000000000003019b47ae68cd7586abcd2a72aa54e746',
    '93ff91d8c5dcd9599fe114c53c0bf9507aae9b8e51b405c504b43b091d4b367c7cfaec86d4d45a19bd0a421a88bc46b7f8d95da65797444edfb276d13ad43166'
  )

  await checkSig_onChain(publicKey, testVals[0].payloadHex, testVals[0].sigHex)
  console.log('************************************************')
  
  process.exit(0)

  verify_rawSig_hashpack_base64()
  console.log('************************************************')

  // await verify_assemblePayload_uft8HashpackSigned()
  // console.log('************************************************')

  
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