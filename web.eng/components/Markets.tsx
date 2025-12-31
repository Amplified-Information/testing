import { useEffect, useState } from 'react'
import { apiClient } from '../grpcClient'
import { MarketResponse } from '../gen/api'
import { useNavigate } from 'react-router'

const Markets = () => {
  const [markets, setMarkets] = useState<MarketResponse[]>([])

  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const result = await apiClient.getMarkets({ limit: 10, offset: 0 })
      const markets = result.response.markets
      setMarkets(markets)
      console.log('All markets:', markets)
    })()
  }, [])

  return (
    <>
      {markets.map(market => (
        <div>
            <a className={'cursor-pointer underline text-blue-700'} key={market.marketId} onClick={() => navigate(`/market/${market.marketId}`)}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${market.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span><b>"{market.statement}"</b></a>
        </div>
      ))}
    </>
  )
}

export default Markets
