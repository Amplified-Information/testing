import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '../AppProvider'

const PlacePredictionConfirmModal = ({ open, onClose, params }: { open: boolean, onClose: () => void, params: { buySell: boolean} }) => {
  const { book } = useAppContext()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full z-10'>
        <h2>Market order:</h2>
        <p>{params.buySell ? 'Sell' : 'Buy'} at {book.bids[0]?.priceUsd}</p>
        <div className='mt-4 text-right'>
          <button className={`btn ${params.buySell ? 'red' : 'green'}`} onClick={async () => {

            // await initWallet()
            // await dAppConnector.openModal()
            // onClose()
            
            // const predictionIntentRequest: PredictionIntentRequest = {
            //   buySell: params.buySell,
            //   price: book.bids[0]?.price,
            //   accountId: '',
            //   sig: ''
            // }
            // const result = await webClient.predictIntent(predictionIntentRequest)
          }}>Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default PlacePredictionConfirmModal
