import { SessionTypes } from '@walletconnect/types'
import { PredictionIntentRequest } from '../gen/api'
import { useEffect, useState } from 'react'
import { genUUIDv7, uint8ToHex } from '../lib/utils'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { smartContractId } from '../constants'

const defaultRequest: PredictionIntentRequest = {
  txid: genUUIDv7(),
  utc: new Date().toISOString(),
  accountId: '0.0.1234',
  buySell: false,
  price: 5000,
  sigHex: ''
}

const Signer = () => {
  // const [sessions, setSessions] = useState<SessionTypes.Struct>()
  const [sigHex, setSigHex] = useState<string>('')
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>(defaultRequest)
  const [thinger, setThinger] = useState<boolean>(false)
  const { spenderAllowance, dAppConnector } = useAppContext()

  // const stringToUint8Array = (str: string): Uint8Array => {
  //   return new TextEncoder().encode(str);
  // }

  useEffect(() => {
    console.log(dAppConnector)

    // if (dAppConnector.signers.length > 0) {
    //   // retrieve spender allowance for this account
    //   console.log(`Retrieving spender allowance for accountId ${dAppConnector.signers[0].getAccountId().toString()} on smart contract ${smartContractId}`)
    //   console.log(dAppConnector.signers[0].getAccountId().toString())
    // }
  }, []) 

  return (
    <>
      {!dAppConnector ? (
        <div>
          DAppConnector not initialized
        </div>
      ) : (
        <div>
          
      
          <code>
            {
            <div
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(predictionIntentRequest, null, 2)
                  .replaceAll('\n', '<br/>')
                  .replaceAll(' ', '&nbsp;'),
              }}
            />
            }
          </code>

          {/* <button className='btn'
              onClick={async () => {
                // await initWallet()

                // const x = await dAppConnector.init()

                if (dAppConnector.signers.length === 0) {
                  const _sessions = await dAppConnector.openModal()
                  console.log('sessions')
                  console.log(_sessions)
                  _sessions.self.publicKey
                  setSessions(_sessions)
                } else {
                  console.log('Already connected sessions:')
                  console.log(dAppConnector.signers)
                }
              }}
            >
              Connect
            </button> */}
          <button className='btn green' onClick={async () => {
                // if (!sessions) {
                //   console.error('No session available')
                //   return
                // }

                // await dAppConnector.() // prevents the flash!
                
                const signer = await dAppConnector.getSigner(dAppConnector.signers[0].getAccountId())
                console.log(signer)

                const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(predictionIntentRequest))
                const multiSig = await signer.sign([bytes], { encoding: 'utf-8' })

                const sig = multiSig[0].signature // reckon most of the time just one sig
                setSigHex(uint8ToHex(sig))
                setPredictionIntentRequest({ ...predictionIntentRequest, sigHex: uint8ToHex(sig) })
                console.log('Signature: ', uint8ToHex(sig))
                

                
                // console.log(dAppConnector)
                // console.log(dAppConnector.signers[0].getAccountId().toString())
                // const toBeSigned: SignMessageParams = {
                //   signerAccountId: dAppConnector.signers[0].getAccountId().toString(),
                //   message: JSON.stringify(data, (key, value) => { typeof value === 'bigint' ? value.toString() : value })
                // }
                // const toBeSigned: SignMessageParams = {
                //   signerAccountId: dAppConnector.signers[0].getAccountId().toString(),
                //   message: 'Hello Hedera!'
                // }
                
                // const result = await dAppConnector.signMessage(toBeSigned)
                // console.log('Signed message result:', result)
          }}>Sign</button>
          <br/>
          <br/>

          {dAppConnector.signers.length > 0 &&
            <>
              Current USD Coin allowance for <code>{dAppConnector.signers[0].getAccountId().toString()}</code> is ${spenderAllowance.toFixed(2)}.
            </>
          }

          <br/>
          <br/>

          <button className='btn orange' onClick={() => {
            console.log('Current spender allowance:', spenderAllowance)


          }}>
            Set a $10 USD Coin allowance
          </button>


          <br/>
          <br/>
          <button className={`btn orange`} disabled={thinger} onClick={ async () => {
            setThinger(true)
            console.log('Submitting order intent to backend API...')

            // grpc call to backend
            // grpcurl -plaintext -import-path ./proto -proto api.proto -d '{"accountId": "0.0.7090546", "buySell": false, "sig": "xxxxxxxxxxxxxxx", "price": 14}' localhost:8888 api.ApiService.PredictIntent
            try {
              
              const result = await apiClient.predictIntent(predictionIntentRequest)
              console.log('PredictIntent response:', result)
            } catch (e) {
              console.error('PredictIntent error:', e)
            } finally {
              setThinger(false)
            }
          }}>
            Submit order intent
          </button>
          </div>
        )}
    </>
  )
}

export default Signer