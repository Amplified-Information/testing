import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useAppContext } from '../AppProvider'
import { apiClient, clobClient } from '../grpcClient'
import GraphPrice from './GraphPrice'
import GraphOrderbook from './GraphOrderbook'
import Comments from './Comments'
import { isValidUUIDv7 } from '../lib/utils'

const Market = () => {
  const { markets, setMarkets, setMarket, setMarketId, setShowPopupTradePanel } = useAppContext()
  const [ bidUsd, setBidUsd ] = useState<number>(0.00)
  const [ askUsd, setAskUsd ] = useState<number>(0.00)
  const { marketId } = useParams()

  useEffect(() => {
    ;(async () => {
      // retrieve one market (marketId)
      // update/add this market to markets (setMarkets), where marketId matches
      const result = await apiClient.getMarketById({ marketId: marketId! })
      
      setMarketId(result.response.marketId)
      setMarket(result.response)
      setMarkets([result.response, ...markets.filter(m => m.marketId !== marketId)])
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!isValidUUIDv7(marketId!)){
        console.warn('Invalid marketId:', marketId)
        return
      }
      const priceResult = await clobClient.getPrice({ marketId })
      setBidUsd(priceResult.response.priceUsdBid)
      setAskUsd(priceResult.response.priceUsdAsk)
    })()
  })

  return (
    <>
      <div>
        <MarketEndDate endDate="31/12/2025" />

        <i>"{markets.find(m => m.marketId === marketId)?.statement}"</i>
        
        <br/>
        <button className="btn-primary" onClick={() => { setShowPopupTradePanel(true) }}>Bet now ${ ((bidUsd + askUsd) / 2).toFixed(2) }</button>
        <br/>
        <br/>
        <img
          src={
            markets.find(m => m.marketId === marketId)?.imageUrl?.trim()
              ? markets.find(m => m.marketId === marketId)!.imageUrl
              : `${window.location.origin}/640_480.png`
          }
        />

        <span className="block text-xs text-muted-foreground mt-1">marketId: {marketId}</span>

        

        <GraphPrice marketId={marketId!} />
        <GraphOrderbook marketId={marketId!} />

        <Comments marketId={marketId!} />
      </div>
    </>
  )
}

const MarketEndDate: React.FC<{ endDate: string }> = ({ endDate }) => {
  return (
    <div className="flex items-center text-sm text-muted-foreground mb-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-clock mr-1 h-4 w-4"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Ends {endDate}
    </div>
  )
}

export default Market
