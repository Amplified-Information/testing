import { PredictionIntentRequest } from '../gen/api'
import { useEffect, useState } from 'react'
import { uint8ToBase64, getMidPrice } from '../lib/utils'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { defaultPredictionIntentRequest, priceUsdStepSize } from '../constants'
import ButtonAmount from './ButtonAmount'

const Signer = () => {
  const { signerZero, spenderAllowanceUsd, book } = useAppContext()
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>(defaultPredictionIntentRequest)
  const [thinger, setThinger] = useState<boolean>(false)
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy')
  
  const [betUsd, setBetUsd] = useState<number>(1.0)
  const [priceUsd, setPriceUsd] = useState<number>(0.0)

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
      _priceUsd = 0 - _priceUsd
    }

    setPredictionIntentRequest({ 
      ...predictionIntentRequest,
      priceUsd: _priceUsd,
      // marketLimit: predictionIntentRequest.marketLimit === "market" ? "market" : "limit"
      qty: betUsd/Math.abs(_priceUsd)
    })

    // setPredictionIntentRequest({
    //   ...predictionIntentRequest,
    //   qty: betUsd/predictionIntentRequest.priceUsd
    // })
  }, [priceUsd, betUsd, buySell])

  // useEffect(() => {
    
  // }, [betUsd])

  return (
    <div>
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


      <input type='checkbox' checked={predictionIntentRequest.marketLimit === 'market'} onClick={() => {
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
            setPriceUsd(getMidPrice(book))
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
          onClick={() => {
            setBuySell('buy')
          }}
        />

        <label htmlFor='sell' className='ml-1'>Sell</label>
        <input 
          type='radio' 
          id='sell' 
          name='buySell' 
          checked={buySell === 'sell'} 
          onClick={() => {
            setBuySell('sell')
          }}
        />
      </div>
     

      <br/>
      <br/>

      <button className='btn green' disabled={!signerZero || thinger} title={!signerZero ? 'Wallet not connected' : predictionIntentRequest.sig.length === 0 ? 'Message not signed' : ''} onClick={async () => {
        setThinger(true)
        console.log('Signing OrderIntent...')
        console.log(signerZero)

        try {
          const predictionIntentRequestSansSig = JSON.parse(JSON.stringify(predictionIntentRequest)) // deep clone
          delete predictionIntentRequestSansSig.sig // remove sig field before signing/serializing!
          const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(predictionIntentRequestSansSig))
          // const bytes: Uint8Array = new TextEncoder().encode("hello")
          const multiSig = await signerZero!.sign([bytes], { encoding: 'utf-8' })

          const sigUint8 = multiSig[0].signature // reckon most of the time just one sig
          setPredictionIntentRequest({ ...predictionIntentRequest, sig: uint8ToBase64(sigUint8) })
          console.log('Signature: ', uint8ToBase64(sigUint8))
        } catch (e) {
          console.error('Error signing predictionIntentRequest: ', e)
          console.error(e)
        } finally {
          setThinger(false)
        }
      }}>
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