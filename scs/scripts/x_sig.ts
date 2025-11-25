import { ContractExecuteTransaction, ContractFunctionParameters, ContractId, PublicKey } from "@hashgraph/sdk"
import { networkSelected, operatorAccountId, operatorKeyType } from "./constants.ts"
import { initHederaClient } from "./lib/hedera.ts"
import { keccak256 } from "ethers";
import { sign } from "crypto";

const [ client, _ ] = initHederaClient(
  networkSelected,
  operatorAccountId,
  operatorKeyType
)

const main = async () => {
  // CLI args: contractId, tokenId
  const [contractId] = process.argv.slice(2)
  if (!contractId) {
    console.error('Usage: ts-node sig.ts <contractId>')
    process.exit(1)
  }
  console.log(`contractId: ${contractId}`)

  // https://github.com/dalvizu/hedera-sdk-rust/blob/e4a3078f025519287886ca1c9287691ea53e08e8/src/key/public_key/tests.rs#L121


  // const publicKey = PublicKey.fromString("302d300706052b8104000a03220002703a9370b0443be6ae7c507b0aec81a55e94e4a863b9655360bd65358caa6588").toBytesRaw()
  // console.log(`publicKey (hex) (len=${publicKey.length}): ${Buffer.from(publicKey).toString("hex")}`)
  

  // const messageHash = Uint8Array.from(Buffer.from("2caf5d9817daef9d9d853d0adffad7d6833589064dadbc8a7b33ed317f72b326", "hex"))
  const messageHash = Buffer.from("c1fd562d42cca69b6391ac9300d706fb58c4ca3aa110d408e39ac8cbc24fb831", "hex")
  console.log(`messageHash (hex) (len=${messageHash.length}): ${Buffer.from(messageHash).toString("hex")}`)
  
  //  publicKey = _publickKey.toBytes()
  // console.log(`messageHash (hex) (len=${publicKey.length}): ${Buffer.from(publicKey).toString("hex")}`)
  const sigHex = "8e06e8561256631955328278c1e93fa8b40a27538298a33e48be699600317f6e05975ff1293b43e4c9c4a082797c787d4667258c52a8f2ce9ef5d546aa7aec01"
  const signature = Uint8Array.from(Buffer.from(sigHex, "hex"))
  // console.log(`signature (hex) (len=${signature.length}): ${Buffer.from(signature).toString("hex")}`)
  //
  // process.exit(1)


  // try {


  //   // account, hash, sig

  //   //  const params = new ContractFunctionParameters()
  //   //   .addAddress("0x440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6")
  //   //   .addBytes(messageHash)
  //   //   .addBytes(Buffer.from("d7e866d6055676682a27c6054e657de97382177e51344bc269e196c998672c402cfe1113bb645efaf1b942ce26958f1342dabc01877967dce7e04080217901a01b", "hex"))
  //   //   .addBytes32(Buffer.from("d7e866d6055676682a27c6054e657de97382177e51344bc269e196c998672c40", "hex"))
  //   //   .addBytes32(Buffer.from("2cfe1113bb645efaf1b942ce26958f1342dabc01877967dce7e04080217901a0", "hex"))
  //   //   .addUint8(27)
      
  //   const params = new ContractFunctionParameters()
  //     .addBytes32(Buffer.from("d7e866d6055676682a27c6054e657de97382177e51344bc269e196c998672c40", "hex"))
  //     .addBytes32(Buffer.from("2cfe1113bb645efaf1b942ce26958f1342dabc01877967dce7e04080217901a0", "hex"))
  //     .addUint8(27)
  //     .addBytes32(messageHash)
  //   const query = new ContractExecuteTransaction()
  //     .setContractId(ContractId.fromString(contractId))
  //     .setGas(4_000_000)
  //     .setFunction(
  //       'verify',
  //       params
  //     )

  //   const result = await query.execute(client)
  //   const record = await result.getRecord(client)
  //   console.log(`recovered address: ${ record.contractFunctionResult?.getAddress(0)}`);
  //   const receipt = await result.getReceipt(client)
  //   console.log('Done. Receipt status: ', receipt.status.toString())
  // } catch (err) {
  //   console.error('Contract call failed:', err)
  // }

  // console.log('---')


  try {
    // const signatureBlob = Buffer.concat([
    //   Buffer.from("d7e866d6055676682a27c6054e657de97382177e51344bc269e196c998672c40", "hex"),
    //   Buffer.from("2cfe1113bb645efaf1b942ce26958f1342dabc01877967dce7e04080217901a0", "hex"),
    //   Buffer.from("1b", "hex")
    // ])
    // console.log(`signatureBlob (hex) (len=${signatureBlob.length}): ${signatureBlob.toString("hex")}`)
    const publicKeyUncompressed = Buffer.from("b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac07877797463801696a719b35cb1d68f60675a91af5819dd710bd651debab70dcb16f", "hex")
    const compressedPubKey = Buffer.from("03b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787", "hex")
    const messageHash = Buffer.from("84575e7983039d2ed8f0d6b420e19f811cc3e5245056a6b30d1fddd0c15c5ac1", "hex")
    const r = Buffer.from("5f6ab0f07c9eb4e64c4ec9a64887de567912b277d3ababd58e9cefbe946d83f1", "hex")
    const s = Buffer.from("2895d0c124c4d5f2b2ce58a01c1c82724b7cfd51cc7d82c9947c2dac3e46bb97", "hex")
    const v = 27
    // const signatureBlob = Buffer.concat([r, s, v])
    // console.log(`signatureBlob (hex) (len=${signatureBlob.length}): ${signatureBlob.toString("hex")}`)
    const params = new ContractFunctionParameters()
      .addAddress("440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6")
      .addBytes(messageHash)
      .addBytes(signature)
      // .addUint8(v)
      // .addBytes32(r) // r
      // .addBytes32(s) // s 
    const query = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(8_000_000)
      .setFunction(
        'verifyHAS',
        params
      )

    const result = await query.execute(client)
    const record = await result.getRecord(client)
    console.log(`${JSON.stringify(record.contractFunctionResult)}`);
    console.log(`boolean: ${record.contractFunctionResult?.getBool(0)}`);
    const receipt = await result.getReceipt(client)
    console.log('Done. Receipt status: ', receipt.status.toString())
  } catch (err) {
    console.error('Contract call failed:', err)
  }

//   verify(
//     0x84575e7983039d2ed8f0d6b420e19f811cc3e5245056a6b30d1fddd0c15c5ac1,

//     0x5f6ab0f07c9eb4e64c4ec9a64887de567912b277d3ababd58e9cefbe946d83f1,
//     0x2895d0c124c4d5f2b2ce58a01c1c82724b7cfd51cc7d82c9947c2dac3e46bb97,
//     27,

//     "b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac0787"
//     "7797463801696a719b35cb1d68f60675a91af5819dd710bd651debab70dcb16f"
// )

  // try {
  //   const params = new ContractFunctionParameters()
  //     .addAddress("0x440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6")
  //     .addBytes32(messageHash)
  //     .addBytes(signature)
  //   const query = new ContractExecuteTransaction()
  //     .setContractId(ContractId.fromString(contractId))
  //     .setGas(4_000_000)
  //     .setFunction(
  //       'isAuthorizedRaw',
  //       params
  //     )

  //   const result = await query.execute(client)
  //   const receipt = await result.getReceipt(client)
  //   console.log('Done. Receipt status: ', receipt.status.toString())
  // } catch (err) {
  //   console.error('Contract call failed:', err)
  // }
}

;(async () => {
  await main()
  process.exit(0)
})()
