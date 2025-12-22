import { PredictionIntentRequest } from '../gen/api'
import { useEffect, useState } from 'react'
import { getMidPrice, floatToBigIntScaledDecimals, assemblePayloadHexForSigning } from '../lib/utils'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { defaultPredictionIntentRequest, priceUsdStepSize, midPriceUsdDefault, smartContractId, usdcDecimals } from '../constants'
import ButtonAmount from './ButtonAmount'
import { getSpenderAllowanceUsd } from '../lib/hedera'
import { keccak256 } from 'ethers'
import { ethers } from 'ethers'
import { proto } from '@hashgraph/proto'
import { base64StringToSignatureMap } from '@hashgraph/hedera-wallet-connect'
import { v7 as uuidv7 } from 'uuid'



const Signer = ({ marketId }: { marketId: string }) => {
  const { signerZero, networkSelected, spenderAllowanceUsd, setSpenderAllowanceUsd, book, dAppConnector, userAccountInfo } = useAppContext()
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>({...defaultPredictionIntentRequest(), marketId: marketId})
  const [thinger, setThinger] = useState<boolean>(false)
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy')
  
  const [betUsd, setBetUsd] = useState<number>(1.0)
  const [priceUsd, setPriceUsd] = useState<number>(0.0)

  useEffect(() => {
    console.log(`marketId: ${marketId}`)
  }, [])

  // TODO - remove this debug messaging
  useEffect(() => {
    console.log(JSON.stringify(predictionIntentRequest))
  }, [predictionIntentRequest])

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0'
    })
  }, [])

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0'
    })
  }, [signerZero])

  useEffect(() => {
    let _priceUsd = predictionIntentRequest.marketLimit === 'market' ? getMidPrice(book) : priceUsd
    if (buySell === 'sell') {
      _priceUsd = 0 - (_priceUsd || midPriceUsdDefault)
    }

    setPredictionIntentRequest({ 
      ...predictionIntentRequest,
      priceUsd: _priceUsd || midPriceUsdDefault,
      qty: betUsd/Math.abs(_priceUsd || midPriceUsdDefault),
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0'
    })

    setThinger(false)

    // setPredictionIntentRequest({
    //   ...predictionIntentRequest,
    //   qty: betUsd/predictionIntentRequest.priceUsd
    // })
  }, [priceUsd, betUsd, buySell])

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      net: networkSelected.toString().toLowerCase()
    })
  }, [networkSelected])

  const resetTx = () => {
    setPredictionIntentRequest({
      // ...defaultPredictionIntentRequest(),
      ...predictionIntentRequest,
      txId: uuidv7(),
      sig: '',
      qty: 0,
      priceUsd: 0.0,
      marketId: marketId,
      generatedAt: new Date().toISOString()
    })
  }

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      publicKey: userAccountInfo ? userAccountInfo.key.key : '',
      keyType: userAccountInfo ? (userAccountInfo.key._type === 'ED25519' ? 1 : userAccountInfo.key._type === 'ECDSA_SECP256K1' ? 2 : 0) : 0,
      evmAddress: userAccountInfo ? userAccountInfo.evm_address.slice(2) : ''
    })
  }, [userAccountInfo])

  // function arrayify(data: string): Uint8Array {
  //   if (typeof data !== 'string' || !data.startsWith('0x')) {
  //     throw new Error('Invalid hex string')
  //   }
  //   const hex = data.slice(2)
  //   const bytes = new Uint8Array(hex.length / 2)
  //   for (let i = 0; i < bytes.length; i++) {
  //     bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  //   }
  //   return bytes
  // }

  return (
    <div>
      <h2>Signer <svg className="inline-block w-5 h-5 cursor-pointer" onClick={() => {
        resetTx()
      }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg></h2>

      <code>
        {
        <div
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(predictionIntentRequest, null, 2)
              .replaceAll('\n', '<br/>')
              .replaceAll(' ', '&nbsp;')
          }}
        />
        }
      </code>

      <br/>
      Amount to bet:
      <br/>
      <ButtonAmount
        value={betUsd}
        onChange={(value) => {
          setBetUsd(value)
        }}  
        max={spenderAllowanceUsd}
      />



      <br/>
      <br/>
      Limit price: 
      <input 
        className='border border-gray-300 rounded px-3 py-2 w-28 disabled:opacity-50 disabled:bg-gray-300'
        min={0} 
        max={1.0} 
        type="number" 
        value={priceUsd} 
        step={priceUsdStepSize}
        onChange={(e) => {
          setPriceUsd(Number(e.target.value))
        }}
        disabled={predictionIntentRequest.marketLimit === 'market'}
      />
      <br/>


      <input type='checkbox' checked={predictionIntentRequest.marketLimit === 'market'} onChange={() => {
        setPredictionIntentRequest({ 
          ...predictionIntentRequest,
          marketLimit: predictionIntentRequest.marketLimit === 'market' ? 'limit' : 'market'
        })
      } } /> Market order



      {predictionIntentRequest.marketLimit === 'limit' &&
        <button 
          className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-1 px-2 rounded text-sm mx-2'
          onClick={() => {
            // setPredictionIntentRequest({ ...predictionIntentRequest, priceUsd: getMidPrice() })
            setPriceUsd(getMidPrice(book) || midPriceUsdDefault)
          }
        }>mid-price</button>
      }

      <br/>
      <div>
        <label htmlFor='buy' className='ml-1 mr-4'>Buy</label>
        <input 
          type='radio' 
          id='buy' 
          name='buySell' 
          checked={buySell === 'buy'} 
          onChange={() => {
            setBuySell('buy')
          }}
        />

        <label htmlFor='sell' className='ml-1'>Sell</label>
        <input 
          type='radio' 
          id='sell' 
          name='buySell' 
          checked={buySell === 'sell'} 
          onChange={() => {
            setBuySell('sell')
          }}
        />
      </div>
     

      <br/>
      <br/>

      <button 
        className='btn green'
        disabled={!signerZero || thinger} title={!signerZero ? 'Wallet not connected' : predictionIntentRequest.sig.length === 0 ? 'Message not signed' : ''} 
        onClick={async () => {
          setThinger(true)
          console.log('Signing OrderIntent...')
          
          try {
            // const payload: ObjForSigning = {
            //   collateralUsd_abs_scaled: floatToBigIntScaledDecimals(Math.abs(predictionIntentRequest.priceUsd * predictionIntentRequest.qty), usdcDecimals).toString(),
            //   marketId_uuid: predictionIntentRequest.marketId.toString(),
            //   txId_uuid: predictionIntentRequest.txId.toString()
            // }

            // Carefully construct a packed payload for keccak256 hashing
            // Then sign the keccak256 hash of the packed payload
            // See: Prism.sol
            //// const marketId_uuid128 = uuidToBigInt(predictionIntentRequest.marketId)
            //// const txId_uuid128 = uuidToBigInt(predictionIntentRequest.txId)

            const packedHex = assemblePayloadHexForSigning(predictionIntentRequest, usdcDecimals)
            console.log(`packedHex: ${packedHex}`)
            const packedKeccakHex = keccak256(Buffer.from(packedHex, 'hex')).slice(2)
            console.log(`packedKeccakHex (len=${Buffer.from(packedKeccakHex, 'hex').length}): ${packedKeccakHex}`)
            console.log('verify at: https://emn178.github.io/online-tools/keccak_256.html')
            //// console.log('x: ', keccak256(Buffer.from(packedHex, 'hex')))
            //// // TODO - put this packing into a function ".AssemblePayloadHexForSigning()" (including the Math.abs bit)
            //// const collateralUsd_abs_scaled = floatToBigIntScaledDecimals(Math.abs(predictionIntentRequest.priceUsd * predictionIntentRequest.qty), usdcDecimals).toString()
            //// console.log(ethers.solidityPacked(['uint256','uint128','uint128'],[collateralUsd_abs_scaled,marketId_uuid128,txId_uuid128]).slice(2))
            //// const packedKeccakHex = ethers.solidityPackedKeccak256(['uint256','uint128','uint128'],[collateralUsd_abs_scaled,marketId_uuid128,txId_uuid128]).slice(2)
            //// console.log(`packedKeccakHex: ${packedKeccakHex}`)


           
            // const payloadHex = ethers.solidityPacked(['uint256','uint128','uint128'],[collateralUsd_abs_scaled,marketId_uuid128,txId_uuid128]).slice(2)
            // console.log(`payloadHex: ${payloadHex}`)

            // // N.B. treat the hex string as a Utf8 string - don't want the hex conversion to remove leading zeros!!!
            // const payloadUtf8 = payloadHex // Yes, this is intentional    // Buffer.from(payloadHex, 'hex').toString('utf8')
            // const keccakHex = keccak256(Buffer.from(payloadUtf8, 'utf8')).slice(2)
            // console.log(`keccakHex: ${keccakHex}`)
            // const sigHex = (await signerZero!.sign([Buffer.from(keccakHex, 'hex')]))[0].signature
            const msgToSign64 = Buffer.from(packedKeccakHex, 'hex').toString('base64')
            console.log(`msgToSign (base64) (len=${msgToSign64.length}): ${msgToSign64}`)
            // console.log(`packedKeccakHex (len=${Buffer.from(packedKeccakHex, 'hex').length}): ${packedKeccakHex}`)
            const sigHex = (await signerZero!.sign([Buffer.from(packedKeccakHex, 'hex')], { encoding: 'base64' }))[0].signature
            console.log(`sig (hex) (len=${sigHex.length}): ${Buffer.from(sigHex).toString('hex')}`)
            console.log(`sig (base64): ${Buffer.from(sigHex).toString('base64')}`)
            setPredictionIntentRequest({ ...predictionIntentRequest, sig: Buffer.from(sigHex).toString('base64') })
            // const serializedPayload = JSON.stringify(payload)
            // console.log(`serializedPayload (utf8): ${serializedPayload}`)

            // const keccak = ethers.keccak256(Buffer.from(serializedPayload, 'utf8')).slice(2) // remove 0x prefix
            // console.log(`keccak (hex) (len=${keccak.length}): ${keccak}`)

            // const sig = (await signerZero!.sign([Buffer.from(keccak)]))[0].signature
            // console.log(`Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)

            // setPredictionIntentRequest({ ...predictionIntentRequest, sig: Buffer.from(sig).toString('base64') })
          } catch (e) {
            console.error('Error signing')
            console.error(e)
          } finally {
            setThinger(false)
          }

        /*
        try {

          const payload: Uint8Array = getSerializedPayloadForSigning(predictionIntentRequest)
          console.log(`*** Serialized payload for signing (hex) (len=${payload.length}):`, Buffer.from(payload).toString('hex'))
          // console.log('*** Serialized payload for signing (base64):', uint8ToBase64(payload))
          // console.log('*** payload len=', payload.length)
          // const safeCopy = new Uint8Array(payload)

          const keccakHash: Uint8Array = keccak_256(payload)
          console.log(`*** Keccak-256 hash of payload (hex) (len=${keccakHash.length}):`, Buffer.from(keccakHash).toString('hex'))
          // console.log('*** Keccak-256 hash of payload (base64):', uint8ToBase64(keccakHash))

          // const testPayload = new Uint8Array([0x01, 0x02, 0x03]) // Replace with the actual payload
          // const hashTest = keccak_256(testPayload)
          // console.log('*** TEST payload (hex):', Buffer.from(testPayload).toString('hex'))
          // console.log('*** TEST keccak-256 hash (hex):', Buffer.from(hashTest).toString('hex'))
          // const multiSig = await signerZero!.sign([keccakHash ], { encoding: 'base64'} ) // 
          const multiSig = await signerZero!.sign([ keccakHash ])
          const sigUint8: Uint8Array = multiSig[0].signature // reckon most of the time just one sig
          setPredictionIntentRequest({ ...predictionIntentRequest, sig: uint8ToBase64(sigUint8) })
          console.log(`*** Signature (hex) (len=${sigUint8.length}): ${Buffer.from((sigUint8)).toString('hex')}`)
          
          // const predictionIntentRequestSansSig = JSON.parse(JSON.stringify(predictionIntentRequest)) // deep clone
          // delete predictionIntentRequestSansSig.sig // remove sig field before signing/serializing!
          // const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(predictionIntentRequestSansSig))
          // // const bytes: Uint8Array = new TextEncoder().encode("hello")
          // const multiSig = await signerZero!.sign([bytes], { encoding: 'utf-8' })

          // const sigUint8 = multiSig[0].signature // reckon most of the time just one sig
          // setPredictionIntentRequest({ ...predictionIntentRequest, sig: uint8ToBase64(sigUint8) })
          // console.log('Signature: ', uint8ToBase64(sigUint8))
        } catch (e) {
          console.error('Error signing predictionIntentRequest: ', e)
          console.error(e)
        } finally {
          setThinger(false)
        }
        */
        }}
      >
        Sign
      </button>
      <br/>
      <br/>

      <button className={'btn orange'} disabled={!signerZero || thinger || predictionIntentRequest.sig.length === 0} title={!signerZero ? 'Wallet not connected' : ''} onClick={ async () => {
        setThinger(true)
        console.log('Submitting order intent to backend API...')

        // grpc call to backend
        // grpcurl -plaintext -import-path ./proto -proto api.proto -d '{"accountId": "0.0.7090546", "buySell": false, "sig": "xxxxxxxxxxxxxxx", "price": 14}' localhost:8888 api.ApiService.PredictIntent
        try {
          console.log(predictionIntentRequest)
          const result = await apiClient.predictIntent(predictionIntentRequest)
          console.log('PredictIntent response:', result)
        } catch (e) {
          console.error('PredictIntent error:', e)
        } finally {
          // update spender allowance after spending:
          // Note: delay!!!
          const _spenderAllowance = await getSpenderAllowanceUsd(networkSelected, smartContractId, signerZero!.getAccountId().toString())
          setSpenderAllowanceUsd(_spenderAllowance)
          setThinger(false)
        }
      }}>
        Submit order intent
      </button>

      <br/>
      <br/>
      <br/>
      <br/>
      <br/>

      <button className='btn' onClick={async () => {
        const msgStr = 'Hello Hedera'
        console.log(`xx msgStr: ${msgStr}`)
        const msgStrHex = Buffer.from(msgStr, 'utf8').toString('hex') // N.B. UTF-8 encoding here!!!  Re-interpreting as UTF-8, can result in invalid characters being replaced with the Unicode replacement character (�, represented as efbfbd in UTF-8).
        console.log(`xx msgStrHex: ${msgStrHex}`)
        const msgHashHex = ethers.keccak256(ethers.toUtf8Bytes(msgStr)).slice(2)  //sha256
        console.log(`xx msgHashHex: ${msgHashHex}`)
        // const msgHash = Uint8Array.from(Buffer.from(msgHashHex, 'hex'))
        // const msgHash = ethers.keccak256(Buffer.from(msgStr, 'utf8')).slice(2) 
        // console.log(`msgHash (hex) (len=${msgHashHex.length}): ${msgHashHex}`)

        // // ethers.toUtf8Bytes(msgStr)
        // let sig = null

        // function signerSignaturesToSignatureMap(signerSignatures: SignerSignature[]): proto.SignatureMap {
        //   const signatureMap = proto.SignatureMap.create({
        //     sigPair: signerSignatures.map((s) => s.publicKey._toProtobufSignature(s.signature))
        //   })

        //   return signatureMap
        // }

        // const signerSignatures = await signerZero!.sign([Buffer.from(msgStr)])
        // // const signerSignatures = await signer.sign(stringToSignerMessage(body))

        // const _signatureMap = proto.SignatureMap.create(
        //   signerSignaturesToSignatureMap(signerSignatures)
        // )

        // console.log('hello: ')
        // const sigBase64 = _signatureMap.sigPair[0].ECDSASecp256k1
        // console.log(`xx Signature (hex) (len=${sigBase64!.length}): ${Buffer.from(sigBase64!).toString('hex')}`)
        // console.log(signerSignatures[0].publicKey.toString())
        // console.log(signerSignatures[0].accountId.toString())
        // const signatureMap = signatureMapToBase64String(_signatureMap)
        // console.log(signatureMap.toString())

        const signMessagParams = {
          signerAccountId: signerZero!.getAccountId().toString(),
          message: msgStr
        }
        const signMessageResult = await dAppConnector?.signMessage(signMessagParams)
        // console.log(signMessageResult as string)
        let signatureMap: proto.SignatureMap | undefined
        if (signMessageResult && 'signatureMap' in signMessageResult) {
          signatureMap = base64StringToSignatureMap(signMessageResult['signatureMap'] as string)
          console.log(signatureMap)
          console.log(Buffer.from(signatureMap.sigPair[0].ECDSASecp256k1!).toString('hex'))
        } else {
          console.error('signMessageResult is undefined or does not contain signatureMap')
        }
        
        // console.log(base64StringToSignatureMap(signMessageResult!.result))
        // return
        // sig = (await signerZero!.sign([Buffer.from(msgStr)]))[0].signature
        // console.log(`xx Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)

        // sig = (await signerZero!.sign([Buffer.from('0x' + msgStrHex, 'hex')]))[0].signature
        // console.log(`xx Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)

        // sig = (await signerZero!.sign([Buffer.from(msgStr, 'utf8')]))[0].signature
        // console.log(`xx Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)
        
        // sig = (await signerZero!.sign([Buffer.from(msgHashHex, 'hex')]))[0].signature
        // console.log(`xx Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)

        // sig = (await signerZero!.sign([Buffer.from('0x' + msgHashHex, 'hex')]))[0].signature
        // console.log(`xx Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)
      }}>
        Test2
      </button>

      <button className='btn' onClick={async () => {
        const pir = {
          txId: '019aab9a-e734-700a-87de-b383095ac8c6',
          marketId: '019a7e77-39e2-72a3-9bea-a63bdfa79d20',
          // qty: 0.02,
          priceUsd: 0.5

          // net: 'testnet',
          // accountId: '0.0.7090546',
          // marketLimit: 'limit',
          // sig: '',
          // generatedAt: '2025-11-22T12:47:27.028Z'
        }

        // const serializedPayload = getSerializedPayloadForSigning(pir)

        const payload = {
          marketId_uuid: pir.marketId,
          priceUsd_abs_scaled: floatToBigIntScaledDecimals(Math.abs(pir.priceUsd), usdcDecimals).toString(),
          txId_uuid: pir.txId
        }
        console.log(`payload: ${JSON.stringify(payload)}`)
        const serializedPayload = JSON.stringify(payload)
        const keccak = ethers.keccak256(Buffer.from(serializedPayload, 'utf8')).slice(2)
        console.log(`keccak (hex) (len=${keccak.length}): ${keccak}`)

        // console.log(`serializedPayload (hex): ${Buffer.from(serializedPayload).toString('hex')}`)
        // console.log(`serializedPayload (utf8): ${Buffer.from(serializedPayload).toString('utf8')}`)
        const sig =  (await signerZero!.sign([Buffer.from('0x' + keccak)]))[0].signature
        // const keccak256 = keccak_256(serializedPayload)
        // console.log(`keccak256 of serializedPayload (hex) (len=${keccak256.length}): ${Buffer.from(keccak256).toString('hex')}`)
        // const sig = (await signerZero!.sign([ keccak256 ], { encoding: 'utf-8' }))[0].signature
        console.log(`Signature (hex) (len=${sig.length}): ${Buffer.from(sig).toString('hex')}`)
        // const { r, s, v } = splitSignature(Buffer.from(sig).toString('hex'))
        // console.log('Signature components:', { r, s, v })
      }}>
        Test
      </button>

      <br/>
      <button onClick={async () => {
        console.log(userAccountInfo)
        // console.log(signerZero!.getAccountKey().toString())
        // console.log(signerZero!)
        // const payloadUtf8 = 'Hello Future'
        // // const payloadUtf8 = '0000000000000000000000000000000000000000000000000000000000004e200189c0a87e807e808000000000000002019aeb0d8112759dba60b701cf0f7c27'
        // // N.B. yes, keep the hex string as a Utf8 string - don't want the hex conversion to remove leading zeros!!!
        // // const payloadUtf8 = Buffer.from(payloadHex, 'hex').toString('utf8')
        // const keccakHex = keccak256(Buffer.from(payloadUtf8)).slice(2)
        // console.log(keccakHex)
        // const signature = (await signerZero!.sign([Buffer.from(keccakHex, 'hex')]))[0].signature
        // console.log(`signature (len=${signature.length}): ${Buffer.from(signature).toString('hex')}`)
        /**
         * Expected output for 'Hello Future':
        keccakHex: d1b7540d985b3225d67861ad5c3b94fd1249711722acee3ba5a3017f0428b1c0

        sigHex (should match with hashpack!) (len=64): 2c0788d2d4b3f484dd5bc7a92a122e1c4d5ef5cd716579a5c17e031f14d060702dd77ff3d9b9d608cd6a6fdfde9c3e92e6ae67d6ac5e7837e0327631ec77b522

        isValidSig: true
        - account (hex): 440a1d7af93b92920bce50b4c0d2a8e6dcfebfd6
        - message/messageHash (hex) (len=80): 19486564657261205369676e6564204d6573736167653a0a3331d1b7540defbfbd5b3225efbfbd7861efbfbd5c3befbfbdefbfbd1249711722efbfbdefbfbd3befbfbdefbfbd017f0428efbfbdefbfbd
        - signature/signatureMap (hex) (len=103): 0a650a2103b6e6702057a1b8be59b567314abecf4c2c3a7492ceb289ca0422b18edbac078732402c0788d2d4b3f484dd5bc7a92a122e1c4d5ef5cd716579a5c17e031f14d060702dd77ff3d9b9d608cd6a6fdfde9c3e92e6ae67d6ac5e7837e0327631ec77b522
        contractId: 0.0.7371263, accountId: 0.0.7090546
        responseCode=22, isAuthorized=true
         */
      }}>
        Test3
      </button>
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  )
}

// import { proto } from '@hashgraph/proto'

// const { signatureMap } = request<SignTransactionResult['result']>({
//   method: HederaJsonRpcMethod.SignMessage,
//   params: {
//     signerAccountId: this._signerAccountId,
//     message: messageToSign,
//   },
// })

// function signatureMapToBase64String(signatureMap: proto.SignatureMap): string {
//   const encoded = proto.SignatureMap.encode(signatureMap).finish()
//   return Uint8ArrayToBase64String(encoded)
// }

// export function Uint8ArrayToBase64String(binary: Uint8Array): string {
//   return Buffer.from(binary).toString('base64')
// }

export default Signer