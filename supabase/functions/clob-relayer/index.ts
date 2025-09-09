import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  Client, 
  TopicMessageSubmitTransaction, 
  TopicId, 
  AccountId, 
  PrivateKey 
} from 'https://esm.sh/@hashgraph/sdk@2.72.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const systemAccountId = Deno.env.get('CLOB_SYSTEM_ACCOUNT_ID')!
const systemAccountPrivateKey = Deno.env.get('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      // Accept and validate a new order
      const { order } = await req.json()
      
      console.log('Received order for relaying:', {
        orderId: order.orderId,
        marketId: order.marketId,
        side: order.side,
        priceTicks: order.priceTicks,
        qty: order.qty
      })

      // Validate order structure
      if (!validateOrder(order)) {
        return new Response(
          JSON.stringify({ error: 'Invalid order structure' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Store order in database
      const { data: orderRow, error: dbError } = await supabase
        .from('clob_orders')
        .insert({
          order_id: order.orderId,
          market_id: order.marketId,
          maker_account_id: order.maker,
          side: order.side,
          price_ticks: order.priceTicks,
          quantity: order.qty,
          time_in_force: order.tif || 'GTC',
          expiry_timestamp: order.expiry,
          nonce: parseInt(order.nonce),
          max_collateral: order.maxCollateral,
          order_signature: order.signature,
          status: 'PENDING'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        return new Response(
          JSON.stringify({ error: 'Failed to store order' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get HCS topic for orders
      const { data: topic } = await supabase
        .from('hcs_topics')
        .select('topic_id')
        .eq('topic_type', 'orders')
        .eq('market_id', order.marketId)
        .eq('is_active', true)
        .single()

      let hcsMessageId = null
      let hcsSequenceNumber = null

      if (topic) {
        try {
          // Publish order to HCS topic
          const orderMessage = JSON.stringify({
            type: 'NEW_ORDER',
            orderId: order.orderId,
            marketId: order.marketId,
            maker: order.maker,
            side: order.side,
            priceTicks: order.priceTicks,
            qty: order.qty,
            signature: order.signature,
            timestamp: Date.now()
          })

          console.log('Publishing to HCS topic:', topic.topic_id)
          
          // Initialize Hedera client and publish message
          const client = Client.forTestnet()
          const operatorAccountId = AccountId.fromString(systemAccountId)
          const operatorPrivateKey = PrivateKey.fromString(systemAccountPrivateKey)
          client.setOperator(operatorAccountId, operatorPrivateKey)

          const transaction = new TopicMessageSubmitTransaction()
            .setTopicId(TopicId.fromString(topic.topic_id))
            .setMessage(orderMessage)

          const txResponse = await transaction.execute(client)
          const receipt = await txResponse.getReceipt(client)
          hcsSequenceNumber = receipt.topicSequenceNumber?.toString()
          hcsMessageId = `${topic.topic_id}:${hcsSequenceNumber}`

          console.log('Successfully published to HCS:', { 
            topicId: topic.topic_id, 
            sequenceNumber: hcsSequenceNumber 
          })
          
          // Mark as published with HCS details
          await supabase
            .from('clob_orders')
            .update({ 
              status: 'PUBLISHED',
              hcs_message_id: hcsMessageId,
              hcs_sequence_number: hcsSequenceNumber ? parseInt(hcsSequenceNumber) : null
            })
            .eq('id', orderRow.id)
        } catch (hcsError) {
          console.error('Failed to publish to HCS, marking as pending:', hcsError)
          // Keep as PENDING if HCS publishing fails
          await supabase
            .from('clob_orders')
            .update({ status: 'PENDING' })
            .eq('id', orderRow.id)
        }
      } else {
        console.warn('No HCS topic found for market, marking as published without HCS')
        await supabase
          .from('clob_orders')
          .update({ status: 'PUBLISHED' })
          .eq('id', orderRow.id)
      }

      console.log('Order relayed successfully:', order.orderId)

      return new Response(
        JSON.stringify({
          success: true,
          orderId: order.orderId,
          status: 'PUBLISHED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'GET') {
      // Get order book or order status
      const url = new URL(req.url)
      const marketId = url.searchParams.get('marketId')
      const orderId = url.searchParams.get('orderId')

      if (orderId) {
        // Get specific order status
        const { data: order, error } = await supabase
          .from('clob_orders')
          .select('*')
          .eq('order_id', orderId)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Order not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ order }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (marketId) {
        // Get order book for market
        const { data: orders, error } = await supabase
          .from('clob_orders')
          .select('*')
          .eq('market_id', marketId)
          .in('status', ['PUBLISHED', 'PARTIAL_FILL'])
          .order('price_ticks', { ascending: false })

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch orders' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Aggregate into order book
        const bids = aggregateOrders(orders.filter(o => o.side === 'BUY'))
        const asks = aggregateOrders(orders.filter(o => o.side === 'SELL'))

        const orderBook = {
          marketId,
          bids: bids.sort((a, b) => b.price - a.price),
          asks: asks.sort((a, b) => a.price - b.price),
          lastUpdate: Date.now()
        }

        return new Response(
          JSON.stringify({ orderBook }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Relayer error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function validateOrder(order: any): boolean {
  return !!(
    order.orderId &&
    order.marketId &&
    order.maker &&
    order.signature &&
    order.side &&
    typeof order.priceTicks === 'number' &&
    typeof order.qty === 'number' &&
    order.nonce
  )
}

function aggregateOrders(orders: any[]) {
  const levels = new Map()
  
  for (const order of orders) {
    const remainingQty = order.quantity - (order.filled_quantity || 0)
    if (remainingQty <= 0) continue

    const existing = levels.get(order.price_ticks) || { quantity: 0, orderCount: 0 }
    levels.set(order.price_ticks, {
      price: order.price_ticks,
      quantity: existing.quantity + remainingQty,
      orderCount: existing.orderCount + 1
    })
  }

  return Array.from(levels.values())
}