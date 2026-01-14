import { useEffect } from 'react'
import { apiClient } from '../grpcClient'
// import { MarketResponse } from '../gen/api'
import { useNavigate } from 'react-router'
import { useAppContext } from '../AppProvider'

const Explore = () => {
  // const { signerZero } = useAppContext()
  const { markets, setMarkets } = useAppContext()

  const navigate = useNavigate()
  
  useEffect(() => {
    ;(async () => {
      const result = await apiClient.getMarkets({
        limit: 100,
        offset: 0
      })
      console.log(result.response.markets)
      setMarkets(result.response.markets)
    })()
  }, [])

  return (
    <>
      {markets.map((market) => (
        <div 
          key={market.marketId}
          className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-md mb-4 cursor-pointer"
          onClick={() => {
            navigate(`/market/${market.marketId}`)
          }}>
          <i className="text-xl font-semibold mb-2">"{market.statement}"</i>
          {market.imageUrl && (
            <img
              src={market.imageUrl}
              alt="Market"
              className="h-auto mb-4 rounded object-contain"
              style={{ maxHeight: 300 }}
            />
          )}
          <p className="text-sm text-gray-500">marketId: {market.marketId}</p>
        </div>
      ))}
    </>
  )
}

export default Explore
