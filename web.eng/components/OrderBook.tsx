

import { useEffect } from 'react'
import { useAppContext } from '../AppProvider'
import { clobClient } from '../grpcClient'

const DEPTH = 20

const OrderBook = () => {
  const { book, setBook } = useAppContext()
  
  useEffect(() => {
    // getBook
    ;(async () => {
      const result = await clobClient.getBook({ depth: DEPTH })
      setBook(result.response)
    })()

    // streamBook
    ;(async () => {
      const stream = clobClient.streamBook({ depth: DEPTH })
      for await (const response of stream.responses) {
        setBook(response)
      }
    })()
  }, [])

  return (
    <div>
      OrderBook
      <ul>
        {(book?.bids ?? []).slice().reverse().map((bid, idx) => (
          <li key={`bid-${idx}`} style={{ color: 'green' }}>
            Buy: {bid.price} @ {bid.count}
          </li>
        ))}  {book?.asks?.map((ask, idx) => (
          <li key={`ask-${idx}`} style={{ color: 'red' }}>
            Sell: {ask.price} @ {ask.count}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OrderBook
