import { PredictionIntentRequest } from '../gen/api'
import { useEffect, useState } from 'react'
import { uint8ToBase64 } from '../lib/utils'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { defaultPredictionIntentRequest, usdcDecimals } from '../constants'
import ButtonAmount from './ButtonAmount'

const Signer = () => {
  const [sig, setSig] = useState<string>('')
  const [buySell, setBuySell] = useState<boolean>(false)
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>(defaultPredictionIntentRequest)
  const [thinger, setThinger] = useState<boolean>(false)
  const { signerZero, spenderAllowanceUsd } = useAppContext()
  const [amountUsd, setAmountUsd] = useState<number>(0)

  useEffect(() => {
    setPredictionIntentRequest(constructPredictionIntentRequest())
  }, [])

  useEffect(() => {
    setPredictionIntentRequest(constructPredictionIntentRequest())
  }, [sig, amountUsd, buySell, signerZero])

  const constructPredictionIntentRequest = (): PredictionIntentRequest => {
    return {
      ...predictionIntentRequest,
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0',
      nShares: amountUsd * (10 ** usdcDecimals),
      buySell,
      sig
    }
  }

  return (
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

      <ButtonAmount value={amountUsd} onChange={(value) => {
        setAmountUsd(value)
        setPredictionIntentRequest({ ...predictionIntentRequest, nShares: value * (10 ** usdcDecimals) })
        setSig('')
      }} max={spenderAllowanceUsd}/>



      <br/>
      <br/>
      Limit price: <input className='border border-gray-300 rounded px-3 py-2 w-24' type="number" value={predictionIntentRequest.priceUsd} onChange={(e) => {
        setPredictionIntentRequest({ ...predictionIntentRequest, priceUsd: Number(e.target.value)})
      }} />

      <br/>
      <br/>

      <button className='btn green' disabled={!signerZero || thinger} title={!signerZero ? 'Wallet not connected' : sig.length === 0 ? 'Message not signed' : ''} onClick={async () => {
        setThinger(true)
        console.log('Signing OrderIntent...')
        console.log(signerZero)

        try {
          const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(predictionIntentRequest))
          const multiSig = await signerZero!.sign([bytes], { encoding: 'utf-8' })

          const sig = multiSig[0].signature // reckon most of the time just one sig
          setSig(uint8ToBase64(sig))
          setPredictionIntentRequest({ ...predictionIntentRequest, sig: uint8ToBase64(sig) })
          console.log('Signature: ', uint8ToBase64(sig))
        } catch (e) {
          console.error('Error signing OrderIntent: ', e)
          console.error(e)
        } finally {
          setThinger(false)
        }
      }}>
        Sign
      </button>
      <br/>
      <br/>

      
      <button className={`btn orange`} disabled={!signerZero || thinger || sig.length === 0} title={!signerZero ? 'Wallet not connected' : ''} onClick={ async () => {
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
          setThinger(false)
        }
      }}>
        Submit order intent
      </button>

      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  )
}

export default Signer