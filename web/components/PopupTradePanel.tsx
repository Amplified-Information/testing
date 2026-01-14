import { useEffect, useState } from 'react'
import { ServerStreamingCall } from '@protobuf-ts/runtime-rpc' // Ensure this is the correct library for your project
import { useAppContext } from '../AppProvider'
// import { MarketResponse } from '../gen/api'
import { clobClient } from '../grpcClient'
import { PriceUpdate } from '../gen/clob'
import { PredictionIntentRequest } from '../gen/api'
import { defaultPredictionIntentRequest } from '../constants'

const PopupTradePanel = () => {
  const { showPopupTradePanel, setShowPopupTradePanel, marketId } = useAppContext()

  const [thinger, setThinger] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [amountUsd, setAmountUsd] = useState(1.00)
  // const [priceUsd, setPriceUsd] = useState(0.50)
  // // const [qty, setQty] = useState(0.00)
  // const [marketLimit, setMarketLimit] = useState<'market' | 'limit'>('market')
  const [predictionIntentRequest, setPredictionIntentRequest] = useState<PredictionIntentRequest>({...defaultPredictionIntentRequest(), marketId: marketId})

  const [bidUsd, setBidUsd] = useState<number>(0.00)
  const [askUsd, setAskUsd] = useState<number>(0.00)

  useEffect(() => {
    console.log('PopupTradePanel mounted for marketId:', marketId)
  }, [marketId, showPopupTradePanel])


  /**
   * Effect to start streaming the order book data for the given marketId.
   * Cleanly end the stream (abort) when the component unmounts
   */
  useEffect(() => {
    const ac = new AbortController()

    async function startStream() {
      console.log('startStream (streamPrice) called for marketId:', marketId)
      let call: ServerStreamingCall | undefined
      try {
        call = clobClient.streamPrice(
          { 
            marketId: marketId
         },
          { signal: ac.signal, abort: ac.signal }  // RpcOptions
        )

        for await (const msg of call.responses) {
          if (ac.signal.aborted) {
            console.log('Stream aborted')
            return
          }
          console.log('msg', msg)
          setBidUsd((msg as PriceUpdate).priceUsdBid)
          setAskUsd((msg as PriceUpdate).priceUsdAsk)
        }
      } catch (err) {
        if (!ac.signal.aborted) {
          console.error('streamPrice error:', err)
        } else {
          console.log('Stream aborted due to controller signal')
        }
      } finally {
        console.log('finally')
        console.info(call)
      }
    }

    if (showPopupTradePanel) { // only start stream if panel is shown!
      startStream()
    }

    return () => {
      console.log('Aborting price stream for marketId:', marketId)
      ac.abort() // cancels the stream on unmount
    }
  }, [showPopupTradePanel])

  useEffect(() => {
    console.log('predictionIntentRequest updated:', predictionIntentRequest)
  }, [predictionIntentRequest])

  if (!showPopupTradePanel) {
    return null 
  }

  return (
    <div
      className="fixed inset-0 z-1002 flex items-start justify-end"
      tabIndex={-1}
      onKeyDown={e => {
      if (e.key === 'Escape') setShowPopupTradePanel(false)
      }}
    >
      {/* Backdrop */}
      <div
      className="fixed inset-0 bg-opacity-40"
      onClick={() => setShowPopupTradePanel(false)}
      aria-label="Close trade panel"
      />

      {/* Panel */}
      <div
      className="relative h-full bg-gray-900 border-l border-gray-800 p-6 shadow-lg w-full sm:w-96 transition-all duration-300"
      style={{ outline: 'none' }}
      onClick={e => e.stopPropagation()}
      >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl cursor-pointer"
        onClick={() => setShowPopupTradePanel(false)}
        aria-label="Close"
      >
        X
      </button>

      <div className="flex items-center mb-2">
        <label className="flex items-center mr-4 cursor-pointer">
          <input
            type="radio"
            name="tradeType"
            value="buy"
            className="hidden peer"
            defaultChecked
            onClick={() => {
              // buy order is indicated by positive priceUsd
              setPredictionIntentRequest(prev => ({ ...prev, priceUsd: Math.abs(prev.priceUsd) }))
            }}
          />
          <span className="px-3 py-1 rounded-l border border-gray-600 bg-gray-800 text-white peer-checked:bg-green-700 peer-checked:border-green-400 transition-colors">
            Buy
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="tradeType"
            value="sell"
            className="hidden peer"
             onClick={() => {
              // a sell order is indicated by negative priceUsd
              setPredictionIntentRequest(prev => ({ ...prev, priceUsd: 0 - Math.abs(prev.priceUsd) }))
            }}
          />
          <span className="px-3 py-1 rounded-r border border-gray-600 bg-gray-800 text-white peer-checked:bg-red-700 peer-checked:border-red-400 transition-colors">
            Sell
          </span>
        </label>
        &nbsp;&nbsp; ${bidUsd.toFixed(2)} | ${askUsd.toFixed(2)}
      </div>

      <label>Amount you wish to bet</label>
      <input
        type="number"
        value={amountUsd}
        placeholder="Amount"
        className="input input-bordered w-full mb-2"

        onChange={(e) => {
          const _amountUsd = Number(e.currentTarget.value)
          setAmountUsd(_amountUsd)

          const currentPrice = predictionIntentRequest.priceUsd < 0 ? askUsd : bidUsd

          setPredictionIntentRequest(prev => ({
            ...prev, 
            qty: _amountUsd / currentPrice,
            priceUsd: prev.priceUsd < 0 ? 0 - currentPrice : currentPrice
          }))
        }}
      />

      <div className="flex items-center mb-2">
        <label className="flex items-center mr-4 cursor-pointer">
        <input
          type="radio"
          name="orderType"
          className="hidden peer"
          checked={predictionIntentRequest.marketLimit === 'market'}
          value='market'
          onChange={(e) => {
            setPredictionIntentRequest(prev => ({ ...prev, marketLimit: e.currentTarget.value as 'market' | 'limit' }))
          }}
        />
        <span className="px-3 py-1 rounded-l border border-gray-600 bg-gray-800 text-white peer-checked:bg-blue-700 peer-checked:border-blue-400 transition-colors">
          Market Order
        </span>
        </label>
        <label className="flex items-center cursor-pointer">
        <input
          type="radio"
          name="orderType"
          className="hidden peer"
          value='limit'
          checked={predictionIntentRequest.marketLimit === 'limit'}
          onChange={(e) => {
            setPredictionIntentRequest(prev => ({ ...prev, marketLimit: e.currentTarget.value as 'market' | 'limit' }))
          }}
        />
        <span className="px-3 py-1 rounded-r border border-gray-600 bg-gray-800 text-white peer-checked:bg-purple-700 peer-checked:border-purple-400 transition-colors">
          Limit Order
        </span>
        </label>
      </div>
      
      {predictionIntentRequest.marketLimit === 'limit' && (
        <>
        <label>Price</label>
        <input
          type="number"
          value={predictionIntentRequest.priceUsd}
          placeholder="Amount"
          className="input input-bordered w-full mb-2"
          onChange={(e) => {
            setPredictionIntentRequest(prev => ({ ...prev, priceUsd: Number(e.target.value) }))
          }}
        />
        </>
      )}

      <button className="btn-orange" onClick={() => {
        try {
          // TODO - can we remove isSigned?
          setThinger(true)
          setIsSigned(true)
        } catch (e) {
        console.error(e)
        } finally {
          setThinger(false)
        }
      }}>Sign</button>

      <button className="btn-primary" disabled={thinger || !isSigned}>Submit{thinger ? 'ing ...': ''}</button>
      </div>
    </div>
  )
}

export default PopupTradePanel
