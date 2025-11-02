import { PredictionIntentRequest } from '../gen/api'
import { useEffect, useState } from 'react'
import { uint8ToBase64 } from '../lib/utils'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { defaultPredictionIntentRequest } from '../constants'
import ButtonAmount from './ButtonAmount'

const Signer = () => {
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>(defaultPredictionIntentRequest)
  const [thinger, setThinger] = useState<boolean>(false)
  const { signerZero, spenderAllowanceUsd, book } = useAppContext()
  const [buySell, setBuySell] = useState<"buy" | "sell">("buy")

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0',
    })
  }, [])

  useEffect(() => {
    setPredictionIntentRequest({
      ...predictionIntentRequest,
      accountId: signerZero ? signerZero.getAccountId().toString() : '0.0.0',
    })
  }, [signerZero])

  useEffect(() => {
    // TODO - remove this
    console.log(JSON.stringify(predictionIntentRequest))
  }, [predictionIntentRequest])

  const getMidPrice = (): number => {
    if (book.bids.length === 0 || book.asks.length === 0) return 0.5
    console.log(book.asks[0].price, " ", book.bids[0].price)
    return (((0 - book.asks[0].price) + book.bids[0].price) / 2)
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

      <br/>
      Amount to bet:
      <br/>
      <ButtonAmount value={predictionIntentRequest.nShares * predictionIntentRequest.priceUsd} onChange={(value) => {
        setPredictionIntentRequest({ ...predictionIntentRequest, nShares: value/predictionIntentRequest.priceUsd })
        // setSig('')
      }} max={spenderAllowanceUsd}/>



      <br/>
      <br/>
      Limit price: <input min={0} max={1.0} className='border border-gray-300 rounded px-3 py-2 w-24 disabled:opacity-50 disabled:bg-gray-300'
        type="number" 
        value={predictionIntentRequest.priceUsd} 
        step={0.01}
        onChange={(e) => {
          setPredictionIntentRequest({ 
            ...predictionIntentRequest,
            priceUsd: predictionIntentRequest.marketLimit === "market" ? Number(e.target.value) : getMidPrice(),
            marketLimit: predictionIntentRequest.marketLimit === "market" ? "market" : "limit"
          })
        }} 
        disabled={predictionIntentRequest.marketLimit === "market"}
      />
      <br/>
      <input type="checkbox" checked={predictionIntentRequest.marketLimit === "market"} onClick={() => {
        setPredictionIntentRequest({ 
          ...predictionIntentRequest,
          marketLimit: predictionIntentRequest.marketLimit === "market" ? "limit" : "market"
        })
      } } /> Market order

      {predictionIntentRequest.marketLimit === "limit" &&
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-1 px-2 rounded text-sm mx-2" onClick={() => {
          setPredictionIntentRequest({ ...predictionIntentRequest, priceUsd: getMidPrice() })
        }}>mid-price</button>
      }

      <br/>
      <div>
        <input 
          type="radio" 
          id="buy" 
          name="buySell" 
          checked={buySell === "buy"} 
          onChange={() => setBuySell("buy")}
        />
        <label htmlFor="buy" className="ml-1 mr-4">Buy</label>
        
        <input 
          type="radio" 
          id="sell" 
          name="buySell" 
          checked={buySell === "sell"} 
          onChange={() => setBuySell("sell")}
        />
        <label htmlFor="sell" className="ml-1">Sell</label>
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

      
      <button className={`btn orange`} disabled={!signerZero || thinger || predictionIntentRequest.sig.length === 0} title={!signerZero ? 'Wallet not connected' : ''} onClick={ async () => {
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