import { useEffect, useState } from 'react'
import { apiClient } from '../grpcClient'
import { MarketResponse } from '../gen/api'

const Explore = () => {
  // const { signerZero } = useAppContext()
  const [ markets, setMarkets ] = useState<MarketResponse[]>([])
  
  useEffect(() => {
    ;(async () => {
      const markets = await apiClient.getMarkets({
        limit: 100,
        offset: 0
      })
      setMarkets(markets.response.markets)
    })()
  }, [])

  return (
    <>
      {markets.map((market) => (
        <div key={market.marketId} className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-md mb-4">
          <a href={`/market/${market.marketId}`} className="text-2xl font-bold text-blue-600 hover:underline">
            <i className="text-xl font-semibold mb-2">"{market.statement}"</i>
            {market.imageUrl && (
              <img src={market.imageUrl} alt="Market" className="w-full h-auto mb-4 rounded" />
            )}
          </a>
          <p className="text-sm text-gray-500">marketId: {market.marketId}</p>
        </div>
      ))}
    </>
  )
}

export default Explore
