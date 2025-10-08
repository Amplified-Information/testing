import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderQueueItem {
  id: string
  order_id: string
  market_id: string
  maker_account_id: string
  side: 'BUY' | 'SELL'
  price_ticks: number
  quantity: number
  max_collateral: number
  time_in_force: string
  expiry_timestamp?: number
  nonce: number
  order_signature: string
  status: string
  priority_score: number
  attempts: number
  created_at: string
}

interface OrderBookLevel {
  price: number
  quantity: number
  orders: number
}

interface OrderBook {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

class OrderMatcher {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async processOrderQueue(workerId: string): Promise<void> {
    console.log(`[${workerId}] Starting order processing cycle`)
    
    // Claim orders from queue
    const { data: queuedOrders, error: claimError } = await this.supabase
      .rpc('claim_order_queue_jobs', { 
        limit_count: 10,
        p_worker_id: workerId 
      })

    if (claimError) {
      console.error(`[${workerId}] Error claiming orders:`, claimError)
      return
    }

    if (!queuedOrders || queuedOrders.length === 0) {
      console.log(`[${workerId}] No orders to process`)
      return
    }

    console.log(`[${workerId}] Processing ${queuedOrders.length} orders`)

    // Process each order
    for (const queueOrder of queuedOrders) {
      try {
        await this.matchOrder(queueOrder)
        
        // Mark order as matched in queue
        await this.supabase
          .from('order_queue')
          .update({ status: 'MATCHED' })
          .eq('id', queueOrder.id)
          
      } catch (error) {
        console.error(`[${workerId}] Error processing order ${queueOrder.order_id}:`, error)
        
        // Mark order as failed
        await this.supabase
          .from('order_queue')
          .update({ 
            status: 'FAILED',
            error_message: error instanceof Error ? error.message : String(error) 
          })
          .eq('id', queueOrder.id)
      }
    }
  }

  async matchOrder(queueOrder: OrderQueueItem): Promise<void> {
    console.log(`Processing order: ${queueOrder.order_id} - ${queueOrder.side} ${queueOrder.quantity} @ ${queueOrder.price_ticks}`)

    // Insert order into clob_orders table
    const { error: insertError } = await this.supabase
      .from('clob_orders')
      .insert({
        order_id: queueOrder.order_id,
        market_id: queueOrder.market_id,
        maker_account_id: queueOrder.maker_account_id,
        side: queueOrder.side,
        price_ticks: queueOrder.price_ticks,
        quantity: queueOrder.quantity,
        max_collateral: queueOrder.max_collateral,
        time_in_force: queueOrder.time_in_force,
        expiry_timestamp: queueOrder.expiry_timestamp,
        nonce: queueOrder.nonce,
        order_signature: queueOrder.order_signature,
        status: 'PENDING',
        filled_quantity: 0
      })

    if (insertError) {
      throw new Error(`Failed to insert order: ${insertError instanceof Error ? insertError.message : String(insertError)}`)
    }

    // Get current order book for matching
    const { data: activeOrders, error: ordersError } = await this.supabase
      .from('clob_orders')
      .select('*')
      .eq('market_id', queueOrder.market_id)
      .in('status', ['PENDING', 'PARTIAL_FILL'])
      .order('price_ticks', { ascending: queueOrder.side === 'BUY' ? false : true })
      .order('created_at', { ascending: true })

    if (ordersError) {
      throw new Error(`Failed to fetch order book: ${ordersError instanceof Error ? ordersError.message : String(ordersError)}`)
    }

    // Find matching orders
    const matches = this.findMatches(queueOrder, activeOrders)
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} matching orders`)
      await this.executeTrades(queueOrder, matches)
    }

    // Update order book snapshot in sequencer_state
    await this.updateOrderBook(queueOrder.market_id)
  }

  private findMatches(incomingOrder: OrderQueueItem, activeOrders: any[]): any[] {
    const matches = []
    let remainingQty = incomingOrder.quantity

    for (const activeOrder of activeOrders) {
      // Skip same side orders
      if (activeOrder.side === incomingOrder.side) continue
      
      // Skip same maker
      if (activeOrder.maker_account_id === incomingOrder.maker_account_id) continue

      // Check price compatibility
      const canMatch = incomingOrder.side === 'BUY' 
        ? incomingOrder.price_ticks >= activeOrder.price_ticks  // Buy at or above ask
        : incomingOrder.price_ticks <= activeOrder.price_ticks  // Sell at or below bid

      if (!canMatch) continue

      // Calculate tradeable quantity
      const availableQty = activeOrder.quantity - (activeOrder.filled_quantity || 0)
      const tradeQty = Math.min(remainingQty, availableQty)

      if (tradeQty > 0) {
        matches.push({
          order: activeOrder,
          quantity: tradeQty,
          price: activeOrder.price_ticks // Use existing order price (price-time priority)
        })

        remainingQty -= tradeQty
        if (remainingQty <= 0) break
      }
    }

    return matches
  }

  private async executeTrades(incomingOrder: OrderQueueItem, matches: any[]): Promise<void> {
    const trades = []
    let totalFilled = 0

    for (const match of matches) {
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Calculate 1% trade fee
      // Trade value = (price_ticks / 100) * quantity (convert ticks to USDC)
      // Fee = trade value * 0.01
      const tradeValueInUsdc = (match.price * match.quantity) / 100
      const totalFee = Math.ceil(tradeValueInUsdc * 0.01 * 1_000_000) // Convert to smallest USDC units (6 decimals)
      const buyerFee = totalFee // Buyer pays the fee (taker fee model)
      const sellerFee = 0 // Seller doesn't pay (maker gets rebate)
      
      // Create trade record with fees
      const trade = {
        trade_id: tradeId,
        market_id: incomingOrder.market_id,
        buy_order_id: incomingOrder.side === 'BUY' ? incomingOrder.order_id : match.order.order_id,
        sell_order_id: incomingOrder.side === 'SELL' ? incomingOrder.order_id : match.order.order_id,
        buyer_account_id: incomingOrder.side === 'BUY' ? incomingOrder.maker_account_id : match.order.maker_account_id,
        seller_account_id: incomingOrder.side === 'SELL' ? incomingOrder.maker_account_id : match.order.maker_account_id,
        quantity: match.quantity,
        price_ticks: match.price,
        trade_timestamp: Date.now() * 1000, // microseconds
        buyer_fee: buyerFee,
        seller_fee: sellerFee,
        total_fee: totalFee
      }
      
      console.log(`Trade fee calculated: ${totalFee} smallest units (${(totalFee / 1_000_000).toFixed(4)} USDC) on trade value ${tradeValueInUsdc.toFixed(2)} USDC`)
      
      trades.push(trade)
      totalFilled += match.quantity

      // Update filled quantities
      await Promise.all([
        // Update incoming order
        this.supabase
          .from('clob_orders')
          .update({ 
            filled_quantity: totalFilled,
            status: totalFilled >= incomingOrder.quantity ? 'FILLED' : 'PARTIAL_FILL'
          })
          .eq('order_id', incomingOrder.order_id),

        // Update matching order
        this.supabase
          .from('clob_orders')
          .update({ 
            filled_quantity: (match.order.filled_quantity || 0) + match.quantity,
            status: (match.order.filled_quantity || 0) + match.quantity >= match.order.quantity ? 'FILLED' : 'PARTIAL_FILL'
          })
          .eq('order_id', match.order.order_id)
      ])

      // Update positions for both parties
      await this.updatePositions(trade)
    }

    // Insert all trades
    if (trades.length > 0) {
      const { data: insertedTrades, error: tradesError } = await this.supabase
        .from('clob_trades')
        .insert(trades)
        .select()

      if (tradesError) {
        throw new Error(`Failed to insert trades: ${tradesError instanceof Error ? tradesError.message : String(tradesError)}`)
      }
      
      // Record platform fees for each trade
      const platformFeeRecords = insertedTrades.map((trade: any) => ({
        trade_id: trade.id,
        market_id: trade.market_id,
        fee_amount: trade.total_fee,
        fee_currency: 'HBAR',
        collected_from: 'buyer',
        settlement_status: 'PENDING'
      }))
      
      if (platformFeeRecords.length > 0) {
        const { error: feesError } = await this.supabase
          .from('platform_fees')
          .insert(platformFeeRecords)
        
        if (feesError) {
          console.error('Failed to record platform fees:', feesError)
          // Don't throw - trade execution is more important
        } else {
          console.log(`Recorded ${platformFeeRecords.length} platform fees`)
        }
      }
      
      console.log(`Executed ${trades.length} trades for order ${incomingOrder.order_id}`)
    }
  }

  private async updatePositions(trade: any): Promise<void> {
    // Update buyer position
    await this.upsertPosition(
      trade.buyer_account_id,
      trade.market_id,
      'LONG',
      trade.quantity,
      trade.price_ticks
    )

    // Update seller position  
    await this.upsertPosition(
      trade.seller_account_id,
      trade.market_id,
      'SHORT',
      -trade.quantity,
      trade.price_ticks
    )
  }

  private async upsertPosition(
    accountId: string,
    marketId: string,
    positionType: string,
    quantityDelta: number,
    price: number
  ): Promise<void> {
    // Check if position exists
    const { data: existingPosition } = await this.supabase
      .from('clob_positions')
      .select('*')
      .eq('account_id', accountId)
      .eq('market_id', marketId)
      .single()

    if (existingPosition) {
      // Update existing position
      const newQuantity = (existingPosition.quantity || 0) + quantityDelta
      const newAvgPrice = ((existingPosition.avg_entry_price || 0) * (existingPosition.quantity || 0) + price * quantityDelta) / newQuantity

      await this.supabase
        .from('clob_positions')
        .update({
          quantity: newQuantity,
          avg_entry_price: newAvgPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPosition.id)
    } else {
      // Create new position
      await this.supabase
        .from('clob_positions')
        .insert({
          account_id: accountId,
          market_id: marketId,
          position_type: positionType,
          quantity: quantityDelta,
          avg_entry_price: price,
          realized_pnl: 0,
          unrealized_pnl: 0,
          collateral_locked: 0
        })
    }
  }

  private async updateOrderBook(marketId: string): Promise<void> {
    // Get active orders
    const { data: activeOrders } = await this.supabase
      .from('clob_orders')
      .select('side, price_ticks, quantity, filled_quantity')
      .eq('market_id', marketId)
      .in('status', ['PENDING', 'PARTIAL_FILL'])

    if (!activeOrders) return

    // Aggregate by price level
    const bids: Map<number, { quantity: number, orders: number }> = new Map()
    const asks: Map<number, { quantity: number, orders: number }> = new Map()

    for (const order of activeOrders) {
      const remainingQty = order.quantity - (order.filled_quantity || 0)
      const map = order.side === 'BUY' ? bids : asks
      
      const existing = map.get(order.price_ticks) || { quantity: 0, orders: 0 }
      map.set(order.price_ticks, {
        quantity: existing.quantity + remainingQty,
        orders: existing.orders + 1
      })
    }

    // Convert to arrays and sort
    const bidLevels = Array.from(bids.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => b.price - a.price) // Descending

    const askLevels = Array.from(asks.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => a.price - b.price) // Ascending

    // Update sequencer state
    await this.supabase
      .from('sequencer_state')
      .upsert({
        market_id: marketId,
        bid_levels: bidLevels,
        ask_levels: askLevels,
        last_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'market_id'
      })
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const matcher = new OrderMatcher(supabaseUrl, supabaseKey)
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    console.log(`[${workerId}] Order matcher started`)
    
    // Process order queue
    await matcher.processOrderQueue(workerId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order matching cycle completed',
        workerId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Order matcher error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Order matching failed', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})