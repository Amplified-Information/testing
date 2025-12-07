import {
  Client,
  PrivateKey,
  ContractId,
  ContractFunctionParameters,
  AccountId,
  ContractExecuteTransaction,
  PublicKey,
  SignerSignature
} from '@hashgraph/sdk'
import { proto } from '@hashgraph/proto'
import { keccak256 } from 'ethers'

// --------------------------------------------------------------------------
// CONFIG
// --------------------------------------------------------------------------

const operatorId = AccountId.fromString('0.0.7090546')
const evmAddress = '440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6'
const privateKeyHex = '1620f5b23ed7467f6730bcc27b1b2c396f4ae92aec70f420bdd886ae26fed81d'
const privateKey = PrivateKey.fromStringECDSA(privateKeyHex)
const publicKey = privateKey.publicKey
// const publicKeyHex = publicKey.toStringRaw()
const client = Client.forTestnet().setOperator(operatorId, privateKey)


// const bytes = Buffer.from('201cdbac0a6fb711718d6e453e7193490acf269781dc1ca96a41964c14f5bc0911', 'hex')
// console.log(bytes.toString())
// process.exit(0)

const contractId = '0.0.7382975'
// const payloadUtf8 = 'Hello Future'
// const payloadHex = '000000000000000000000000000000000000000000000000000000000001fbd00189c0a87e807e808000000000000002019aef0d6768773499ea9a9727e26c94'
const payloadHex = '0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000003019af3cfbabc70ed8271834875ab221a'
// 000000000000000000000000000000000000000000000000000000000001fbd0
// 0189c0a87e807e808000000000000002
// 019aef0d6768773499ea9a9727e26c94
// N.B. treat the hex string as a Utf8 string - don't want the hex conversion to remove leading zeros!!!
const payloadUtf8 = payloadHex // Yes, this is intentional     // Buffer.from(payloadHex, 'hex').toString('utf8')
console.log(Buffer.from(payloadUtf8).toString('hex'))
// const payloadBytes = Buffer.from(payloadUtf8)
// const payloadPrefixedUtf8 = prefixMessageToSign(payloadUtf8)
// const payloadPrefixedBytes = Buffer.from(payloadPrefixedUtf8, 'utf8')
const keccakHex = keccak256(Buffer.from(payloadUtf8)).slice(2)
console.log(`keccakHex: ${keccakHex}`)
const keccakUtf8 = Buffer.from(keccakHex, 'hex').toString()
console.log(`keccakUtf8 (hex): ${Buffer.from(keccakUtf8).toString('hex')}`)
console.log(`keccakUtf8: ${keccakUtf8}`)
const keccakPrefixedUtf8 = prefixMessageToSign(keccakUtf8)
console.log(`keccakPrefixedUtf8: ${keccakPrefixedUtf8}`)
const keccakPrefixedBytes = Buffer.from(keccakPrefixedUtf8, 'utf8')

const sigBytes = privateKey.sign(keccakPrefixedBytes)
const sigHex = Buffer.from(sigBytes).toString('hex')
console.log(`sigHex (should match with hashpack!) (len=${sigBytes.length}): ${sigHex}`)

// raw signature verify (protobuf SignatureMap way is further down)
const isVerifiedRaw = publicKey.verify(keccakPrefixedBytes, sigBytes)
console.log(`---> isVerifiedRaw (should be true): ***${isVerifiedRaw}***`)


// --------------------------------------------------------------------------
// CORRESPONDING FRONT_END SIGNATURE VERIFICATION
// --------------------------------------------------------------------------
// <button onClick={async () => {
//   const payloadUtf8 = 'Hello Future'
//   const keccakHex = keccak256(Buffer.from(payloadUtf8)).slice(2)
//   console.log(keccakHex)
//   const signature = (await signerZero!.sign([Buffer.from(keccakHex, 'hex')]))[0].signature
//   console.log(`signature (len=${signature.length}): ${Buffer.from(signature).toString('hex')}`)
// }}>
//   Test3
// </button>

const signerSignature: SignerSignature = {
  signature: sigBytes,
  publicKey: publicKey,
  accountId: operatorId
}
const isValidSig = verifySignerSignature(keccakUtf8, signerSignature, publicKey)
console.log(`---> isValidSig: ***${isValidSig}***`)


const signatureMapBytes = buildSignatureMap(publicKey, sigBytes)


let tx
let record
let result
let params

tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(contractId))
  // .setGas(100_000)
  .setGas(5_000_000)
  .setFunction('test2', new ContractFunctionParameters())
  .execute(client)

record = await tx.getRecord(client)
result = record.contractFunctionResult
if (result) {
  console.log(`result: ${result.getResult(['bytes','bytes32'])}`)
} else {
  console.error('No contract function result found.')
}



/***
// 0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000003019af3cfbabc70ed8271834875ab221a
// Signer.tsx:219 packedKeccakHex: b29dafe9bf29bb9214f26cc4bc0c55ad43e6af8cc8bf1c7f917e098eff8368c1
// Signer.tsx:229 msgToSign (base64) (len=44): sp2v6b8pu5IU8mzEvAxVrUPmr4zIvxx/kX4Jjv+DaME=
// Signer.tsx:230 packedKeccakHex (len=32): b29dafe9bf29bb9214f26cc4bc0c55ad43e6af8cc8bf1c7f917e098eff8368c1
// Signer.tsx:232 sigHex (len=64): 22c6b576acfe4d926d005d5d70d0300aacc981d5978ae7bd2e42d3d49f53997e4d4a9cdf6d523d0fd1de3b95392cbbada69770bd099854c1af204b3dbc7e3027

params = new ContractFunctionParameters()
  // address account
  // bytes memory messageHash
  // bytes memory signature
  .addAddress(evmAddress)
  .addBytes(Buffer.from(prefixMessageToSign('sp2v6b8pu5IU8mzEvAxVrUPmr4zIvxx/kX4Jjv+DaME='))) // works
  .addBytes(buildSignatureMap(publicKey, Buffer.from('22c6b576acfe4d926d005d5d70d0300aacc981d5978ae7bd2e42d3d49f53997e4d4a9cdf6d523d0fd1de3b95392cbbada69770bd099854c1af204b3dbc7e3027', 'hex'))) // works
  // .addBytes(Buffer.from('22c6b576acfe4d926d005d5d70d0300aacc981d5978ae7bd2e42d3d49f53997e4d4a9cdf6d523d0fd1de3b95392cbbada69770bd099854c1af204b3dbc7e3027', 'hex'))
  // .addBytes(Buffer.from(sig, 'hex'))

tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(contractId))
  // .setGas(100_000)
  .setGas(5_000_000)
  .setFunction('isAuthorizedPublic', params)
  .execute(client)

// const receipt = await tx.getReceipt(client)
record = await tx.getRecord(client)
result = record.contractFunctionResult
if (result) {
  const responseCode = result.getInt64(0)
  const isAuthorized = result.getBool(1)

  console.log(`contractId: ${contractId}, accountId: ${operatorId.toString()}`)
  console.log(`responseCode=${responseCode}, isAuthorized=${isAuthorized}`)
} else {
  console.error('No contract function result found.')
}
***/

// 0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000003019af3cfbabc70ed8271834875ab221a
params = new ContractFunctionParameters()
  // uint256 collateralUsd
  // uint128 marketId
  // uint128 txId
  .addUint256(BigInt('0x0000000000000000000000000000000000000000000000000000000000004e20').toString())
  .addUint128(BigInt('0x0189c0a87e807e808000000000000003').toString())
  .addUint128(BigInt('0x019af3cfbabc70ed8271834875ab221a').toString())

tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(contractId))
  // .setGas(100_000)
  .setGas(5_000_000)
  .setFunction('test3', params)
  .execute(client)

// const receipt = await tx.getReceipt(client)
record = await tx.getRecord(client)
result = record.contractFunctionResult
if (result) {
  console.log(`result: ${result.getResult(['bytes','bytes32','bytes','bytes'])}`)
} else {
  console.error('No contract function result found.')
}






// --------------------------------------------------------------------------
// QUERY
// --------------------------------------------------------------------------
// console.log(`- account (hex): ${evmAddress}`)
console.log(`- message/messageHash (hex) (len=${keccakPrefixedBytes.length}): ${Buffer.from(keccakPrefixedBytes).toString('hex')}`)
// console.log(`- signatureMap (hex) (len=${signatureMapBytes.length}): ${Buffer.from(signatureMapBytes).toString('hex')}`)
// console.log(`- signature (hex) (len=${sigBytes.length}): ${Buffer.from(sigBytes).toString('hex')}`)


// 0x19486564657261205369676e6564204d6573736167653a0a3430737032763662387075354955386d7a45764178567255506d72347a497678782f6b58344a6a762b44614d453d
// - message/messageHash (hex) (len=81): 19486564657261205369676e6564204d6573736167653a0a3330efbfbdefbfbd72efbfbd78efbfbdcf82132d2defbfbd1fefbfbd24efbfbd476aefbfbdefbfbd36efbfbd48efbfbd365d45efbfbd527a08
params = new ContractFunctionParameters()
  // address account,
  // bytes memory messageHash,
  // bytes memory signature
  .addAddress(evmAddress)
  .addBytes(Buffer.from('b29dafe9bf29bb9214f26cc4bc0c55ad43e6af8cc8bf1c7f917e098eff8368c1', 'hex')) // keccakPrefixedBytes) // Buffer.from('INCORRECT'))
  .addBytes(signatureMapBytes)
  // .addBytes(Buffer.from(sig, 'hex'))

tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(contractId))
  // .setGas(100_000)
  .setGas(5_000_000)
  .setFunction('isAuthorizedPublic', params)
  .execute(client)

// const receipt = await tx.getReceipt(client)
record = await tx.getRecord(client)
result = record.contractFunctionResult
if (result) {
  const responseCode = result.getInt64(0)
  const isAuthorized = result.getBool(1)

  console.log(`contractId: ${contractId}, accountId: ${operatorId.toString()}`)
  console.log(`responseCode=${responseCode}, isAuthorized=${isAuthorized}`)
} else {
  console.error('No contract function result found.')
}


process.exit(0)






params = new ContractFunctionParameters()
  // uint128 marketId,
  // address signerYes,
  // uint256 collateralUsdAbsScaled,
  // uint128 txIdYes,
  // bytes calldata sigYes
  .addUint128(BigInt('0x0189c0a87e807e808000000000000002').toString())
  .addAddress(evmAddress)
  .addUint256(BigInt('0x000000000000000000000000000000000000000000000000000000000001fbd0').toString())
  .addUint128(BigInt('0x019aef0d6768773499ea9a9727e26c94').toString())
  .addBytes(signatureMapBytes)

tx = await new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(contractId))
  // .setGas(100_000)
  .setGas(5_000_000)
  .setFunction('test', params)
  .execute(client)

// const receipt = await tx.getReceipt(client)
record = await tx.getRecord(client)
result = record.contractFunctionResult
if (result) {
  const responseCode = result.getInt64(0)
  const isAuthorized = result.getBool(1)

  console.log(`contractId: ${contractId}, accountId: ${operatorId.toString()}`)
  console.log(`responseCode=${responseCode}, isAuthorized=${isAuthorized}`)
} else {
  console.error('No contract function result found.')
}








console.log(`contractId: ${contractId}`)
process.exit(0)






// Build SignatureMap protobuf
function buildSignatureMap(publicKey: PublicKey, signature: Uint8Array) {
  // const signature = privateKey.sign(message)
  // console.log(`signature: ${Buffer.from(signature).toString('hex')}`)

  const sigPair = proto.SignaturePair.create({
    pubKeyPrefix: publicKey.toBytesRaw(),            // prefix = full key
    ECDSASecp256k1: signature                        // OR ed25519 depending on key type
  })

  const sigMap = proto.SignatureMap.create({
    sigPair: [sigPair]
  })

  const bytes = proto.SignatureMap.encode(sigMap).finish()
  return bytes
}


function prefixMessageToSign(messageUtf8: string) {
  console.log('---- prefixMessageToSign -----')
  console.log(`hex representation of messageUtf8: ${Buffer.from(messageUtf8).toString('hex')}`)
  console.log(messageUtf8.length)
  console.log(messageUtf8)
  // const binaryRepresentation = messageUtf8
  //   .split('')
  //   .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
  //   .join(' ')
  // console.log(`Binary representation of messageUtf8: ${binaryRepresentation}`)
  
  console.log('---- END prefixMessageToSign -----')
  // return '\x19Hedera Signed Message:\n' + messageUtf8.length + messageUtf8
  return '\x19Hedera Signed Message:\n' + messageUtf8.length + messageUtf8
}

function verifySignerSignature(messageUtf8: string, signerSignature: SignerSignature, publicKey: PublicKey): boolean {
  const signature = signerSignature.signature

  if (!signature) throw new Error('Signature not found in signature map')

  return publicKey.verify(Buffer.from(prefixMessageToSign(messageUtf8)), signature)
}
