

import { useEffect } from 'react'
import { useAppContext } from '../AppProvider'
import { clobClient } from '../grpcClient'
import { getMidPrice, getSpreadPercent } from '../lib/utils'

const DEPTH = 0

const OrderBook = () => {
  const { book, setBook, signerZero } = useAppContext()
  
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
        {/* {book?.bids?.map((bid, idx) => (
          <li key={`bid-${idx}`} style={{ color: 'green' }}>
            {bid.count} {bid.price}
          </li>
        ))} */}
        
        {(book?.asks ?? []).slice().sort((a, b) => a.priceUsd - b.priceUsd).map((ask, idx) => (
          <li key={`ask-${idx}`} style={{ color: 'red' }}>
            ${(0 - ask.priceUsd).toFixed(4)} &mdash; {ask.qty.toFixed(2)} {ask.accountId === signerZero?.getAccountId().toString() ? '(You)' : ''}
          </li>
        ))}
        --- mid-price: {typeof getMidPrice(book) === 'undefined' ? 'N/A' : getMidPrice(book)!.toFixed(4)}, spread: {typeof getSpreadPercent(book) === 'undefined' ? 'N/A' : getSpreadPercent(book)!.toFixed(2)}% ---
        {(book?.bids ?? []).slice().sort((a, b) => b.priceUsd - a.priceUsd).map((bid, idx) => (
          <li key={`bid-${idx}`} style={{ color: 'green' }}>
            ${bid.priceUsd.toFixed(4)} &mdash; {bid.qty.toFixed(2)} {bid.accountId === signerZero?.getAccountId().toString() ? '(You)' : ''}
          </li>
        ))} 
        
        {/* {book?.asks?.map((ask, idx) => (
          <li key={`ask-${idx}`} style={{ color: 'red' }}>
            {ask.count} {ask.price}
          </li>
        ))} */}
      </ul>
    </div>
  )
}

export default OrderBook
