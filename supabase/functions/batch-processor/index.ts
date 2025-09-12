import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('Batch processor: Starting batch processing cycle')
    
    // Get recent trades to batch (last 30 seconds or 50 trades)
    const cutoffTime = new Date(Date.now() - 30 * 1000).toISOString()
    
    const { data: recentTrades, error: tradesError } = await supabase
      .from('clob_trades')
      .select('*')
      .gte('created_at', cutoffTime)
      .is('batch_id', null) // Only unbatched trades
      .limit(50)
    
    if (tradesError) {
      throw new Error(`Failed to fetch recent trades: ${tradesError.message}`)
    }
    
    if (!recentTrades || recentTrades.length === 0) {
      console.log('No trades to batch')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No trades to batch',
          tradesProcessed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    console.log(`Batching ${recentTrades.length} trades`)
    
    // Group trades by market
    const tradesByMarket = new Map<string, any[]>()
    for (const trade of recentTrades) {
      const marketTrades = tradesByMarket.get(trade.market_id) || []
      marketTrades.push(trade)
      tradesByMarket.set(trade.market_id, marketTrades)
    }
    
    const batchResults = []
    
    // Create batches for each market
    for (const [marketId, trades] of tradesByMarket.entries()) {
      const batchId = Date.now() + Math.floor(Math.random() * 1000)
      const windowStart = Math.min(...trades.map(t => t.trade_timestamp))
      const windowEnd = Math.max(...trades.map(t => t.trade_timestamp))
      const totalVolume = trades.reduce((sum, t) => sum + t.quantity, 0)
      
      // Create batch record
      const { data: batchData, error: batchError } = await supabase
        .from('clob_batches')
        .insert({
          batch_id: batchId,
          market_id: marketId,
          window_start: windowStart,
          window_end: windowEnd,
          trades_count: trades.length,
          cancels_count: 0,
          input_order_root: `batch_${batchId}_orders`,
          book_snapshot_root: `batch_${batchId}_snapshot`,
          sequencer_signature: `seq_sig_${batchId}`,
          settlement_status: 'PENDING'
        })
        .select()
        .single()
      
      if (batchError) {
        console.error('Failed to create batch:', batchError)
        continue
      }
      
      // Update trades with batch ID
      const { error: updateError } = await supabase
        .from('clob_trades')
        .update({ batch_id: batchData.id })
        .in('id', trades.map(t => t.id))
      
      if (updateError) {
        console.error('Failed to update trades with batch ID:', updateError)
        continue
      }
      
      // Prepare HCS batch message
      const batchSummary = {
        type: 'CLOB_BATCH',
        batchId: batchId,
        marketId: marketId,
        tradesCount: trades.length,
        totalVolume: totalVolume,
        windowStart: windowStart,
        windowEnd: windowEnd,
        timestamp: Date.now()
      }
      
      // Publish batch to HCS via clob-relayer
      try {
        const { data: relayerResponse, error: relayerError } = await supabase.functions.invoke('clob-relayer', {
          body: {
            type: 'BATCH',
            batchId: batchId,
            trades: trades,
            orderSummary: batchSummary,
            marketId: marketId
          }
        })
        
        if (relayerError) {
          console.error('Failed to publish batch to HCS:', relayerError)
        } else {
          console.log('Batch published to HCS successfully:', batchId)
        }
      } catch (hcsError) {
        console.error('HCS publishing failed for batch:', batchId, hcsError)
      }
      
      batchResults.push({
        batchId,
        marketId,
        tradesCount: trades.length,
        totalVolume
      })
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Batch processing completed',
        batchesCreated: batchResults.length,
        tradesProcessed: recentTrades.length,
        batches: batchResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Batch processor error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Batch processing failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})