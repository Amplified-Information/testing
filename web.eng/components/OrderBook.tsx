

import { useEffect } from 'react'
import { ServerStreamingCall } from '@protobuf-ts/runtime-rpc' // Ensure this is the correct library for your project
import { useAppContext } from '../AppProvider'
import { clobClient } from '../grpcClient'
import { getMidPrice, getSpreadPercent } from '../lib/utils'
import Cancel from './Cancel'
import { BookSnapshot } from '../gen/clob'

const DEPTH = 0 // TODO

const OrderBook = ({ marketId }: { marketId: string }) => {
  const { book, setBook, signerZero } = useAppContext()
 
  useEffect(() => {
  const controller = new AbortController()

  async function startStream() {
    let call: ServerStreamingCall | undefined
    try {
      call = clobClient.streamBook(
        { marketId, depth: DEPTH },
        { signal: controller.signal }  // RpcOptions
      )

      for await (const msg of call.responses) {
        if (controller.signal.aborted) {
          console.log('Stream aborted')
          return
        }
        setBook(msg as BookSnapshot)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('streamBook error:', err)
      } else {
        console.log('Stream aborted due to controller signal')
      }
    } finally {
      // Ensure transport is closed
      // if (call.s) {
      console.log('finally')
      console.info(call)
      
        // call.() // Manually close the transport if supported
      // }
    }
  }

  startStream()

  return () => {
    console.log('Aborting order book stream for marketId:', marketId)
    controller.abort() // cancels the stream on unmount
  }
}, [marketId])

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
          <li key={`ask-${idx}`}>
            <span style={{ color: 'red' }}>
              ${(0 - ask.priceUsd).toFixed(4)} &mdash; {ask.qty.toFixed(2)}</span>
              &nbsp;{ask.accountId === signerZero?.getAccountId().toString() ? <Cancel txId={ask.txId} /> : ''}
          </li>
        ))}
        --- mid-price: {typeof getMidPrice(book) === 'undefined' ? 'N/A' : getMidPrice(book)!.toFixed(4)}, spread: {typeof getSpreadPercent(book) === 'undefined' ? 'N/A' : getSpreadPercent(book)!.toFixed(2)}% ---
        {(book?.bids ?? []).slice().sort((a, b) => b.priceUsd - a.priceUsd).map((bid, idx) => (
          <li key={`bid-${idx}`}>
            <span style={{ color: 'green' }}>
            ${bid.priceUsd.toFixed(4)} &mdash; {bid.qty.toFixed(2)}</span>
            &nbsp;{bid.accountId === signerZero?.getAccountId().toString() ? <Cancel txId={bid.txId} /> : ''}
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
