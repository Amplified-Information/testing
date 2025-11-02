import { useState } from 'react'
import { useAppContext } from '../AppProvider'
import PlacePredictionConfirmModal from './PlacePredictionConfirmModal'

const PlacePrediction = () => {
  const { book, setBook } = useAppContext()
  const [isModalShowing, setIsModalShowing] = useState(false)
  const [ buySell, setBuySell ] = useState(false)

  const buy = () => {
    // Implement buy logic
    // popup an overlay
    // confirm order
    // hashpack prompt
    // send funds
    setIsModalShowing(true)
  }

  const sell = () => {
    // Implement sell logic
  }

  return (
    <div>
      <h2>Place a Prediction</h2>

      <button className='btn green' onClick={() => { 
        setBuySell(false)
        setIsModalShowing(true)
      }}>Buy {book.bids[0]?.price}</button>&nbsp;
      <button className='btn red' onClick={() => { 
        setBuySell(true)
        setIsModalShowing(true)
      }}>Sell {(1 + book.asks[0]?.price).toFixed(3)}</button>

      <PlacePredictionConfirmModal open={isModalShowing} onClose={() => { setIsModalShowing(false) }} params={{ buySell }} />
    </div>
  )
}

export default PlacePrediction
