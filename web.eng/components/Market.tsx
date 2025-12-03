import { useNavigate, useParams } from 'react-router'
import OrderBook from './OrderBook'
import Signer from './Signer'
import { useEffect } from 'react'
import { isValidUUIDv7 } from '../lib/utils'
import { useAppContext } from '../AppProvider'
import { apiClient } from '../grpcClient'

const Market = () => {
  const navigate = useNavigate()
  const { marketId } = useParams()
  const { setMarket } = useAppContext()

  useEffect(() => {
    if (!isValidUUIDv7(marketId!)) {
      console.error('Invalid marketId:', marketId)
      navigate('/')
      return
    }
    (async () => {
      const result = await apiClient.getMarketById({ marketId: marketId! })
      const market = result.response
      setMarket(market)
    })()
  }, [marketId])
  
  return (
    <div>
      <div className={'text-center'}>
        <h3>{}</h3>
        marketId: <b>{marketId}</b>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* <div style={{ flex: 1 }}>
          <PlacePrediction />
        </div> */}
      
        <div style={{ flex: 1, marginLeft: '20px' }}>
          <h2>Order Book</h2>
          <OrderBook marketId={marketId!} />
        </div>
        <div style={{ flex: 1, marginLeft: '20px' }}>
          <Signer marketId={marketId!} />
        </div>
      </div>
    </div>
  )
}

export default Market
