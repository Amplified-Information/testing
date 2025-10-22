import OrderBook from './OrderBook'
import PlacePrediction from './PlacePrediction'
import Signer from './Signer'

const Home = () => {
  
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <PlacePrediction />
      </div>
      <div style={{ flex: 1, marginLeft: '20px' }}>
        <h2>Order Book</h2>
        <OrderBook />
      </div>
      <div style={{ flex: 1, marginLeft: '20px' }}>
        <h2>Signer</h2>
        <Signer />
      </div>
    </div>
  )
}

export default Home
