import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Trade {
  id: string;
  trade_id: string;
  buy_order_id: string;
  sell_order_id: string;
  buyer_account_id: string;
  seller_account_id: string;
  price_ticks: number;
  quantity: number;
  market_id: string;
  created_at: string;
  buyer_fee?: number;
  seller_fee?: number;
  total_fee?: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🏦 [Batch Settlement Worker] Starting batch settlement process...');

    // Step 1: Fetch unsettled trades (limit to 10 per batch for efficiency)
    const { data: unsettledTrades, error: tradesError } = await supabase
      .from('clob_trades')
      .select('*')
      .is('batch_id', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (tradesError) {
      console.error('❌ Failed to fetch unsettled trades:', tradesError);
      throw tradesError;
    }

    if (!unsettledTrades || unsettledTrades.length === 0) {
      console.log('✅ No unsettled trades found. Nothing to settle.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No trades to settle',
          tradesProcessed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Found ${unsettledTrades.length} unsettled trades`);

    // Step 2: Group trades by market
    const tradesByMarket = unsettledTrades.reduce((acc, trade) => {
      if (!acc[trade.market_id]) {
        acc[trade.market_id] = [];
      }
      acc[trade.market_id].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);

    const batchResults = [];

    // Step 3: Create batch for each market
    for (const [marketId, trades] of Object.entries(tradesByMarket)) {
      console.log(`🔄 Creating batch for market ${marketId} with ${trades.length} trades`);

      const windowStart = Math.min(...trades.map(t => new Date(t.created_at).getTime()));
      const windowEnd = Date.now();

      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('clob_batches')
        .insert({
          market_id: marketId,
          batch_id: Date.now(), // Use timestamp as batch ID
          window_start: windowStart,
          window_end: windowEnd,
          input_order_root: '0x' + Math.random().toString(36).substr(2, 16), // Mock merkle root
          book_snapshot_root: '0x' + Math.random().toString(36).substr(2, 16), // Mock merkle root
          trades_count: trades.length,
          cancels_count: 0,
          sequencer_signature: '0x' + Math.random().toString(36).substr(2, 32), // Mock signature
          settlement_status: 'PENDING',
        })
        .select()
        .single();

      if (batchError) {
        console.error(`❌ Failed to create batch for market ${marketId}:`, batchError);
        continue;
      }

      console.log(`✅ Created batch ${batch.id} for market ${marketId}`);

      // Step 4: Update trades with batch_id
      const tradeIds = trades.map(t => t.id);
      const { error: updateError } = await supabase
        .from('clob_trades')
        .update({ 
          batch_id: batch.id,
        })
        .in('id', tradeIds);

      if (updateError) {
        console.error(`❌ Failed to update trades with batch_id:`, updateError);
        continue;
      }

      console.log(`✅ Updated ${tradeIds.length} trades with batch_id ${batch.id}`);

      // TODO: Step 5: Call smart contract settleBatch() function
      // This would use Hedera SDK to call the settlement contract
      // For now, we'll just mark the batch as SUBMITTED
      
      console.log(`🔗 TODO: Submit batch ${batch.id} to settlement smart contract`);
      console.log(`   Trades to settle:`, trades.map(t => ({
        buyer: t.buyer_account_id,
        seller: t.seller_account_id,
        amount: t.quantity,
        price: t.price_ticks / 100,
        buyerFee: t.buyer_fee || 0,
        totalFee: t.total_fee || 0
      })));
      
      // Calculate total fees collected in this batch
      const totalFeesCollected = trades.reduce((sum, t) => sum + (t.total_fee || 0), 0);
      console.log(`💰 Total platform fees in batch: ${totalFeesCollected} smallest units (${(totalFeesCollected / 1_000_000).toFixed(4)} USDC)`);

      // Simulate settlement delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update batch status (in production, this would happen after contract confirmation)
      const { error: statusError } = await supabase
        .from('clob_batches')
        .update({ 
          settlement_status: 'SUBMITTED',
          settlement_tx_hash: '0x' + Math.random().toString(36).substr(2, 32) // Mock tx hash
        })
        .eq('id', batch.id);

      if (statusError) {
        console.error(`❌ Failed to update batch status:`, statusError);
      } else {
        console.log(`✅ Batch ${batch.id} marked as SUBMITTED`);
      }
      
      // Update platform fees settlement status
      const { error: feeStatusError } = await supabase
        .from('platform_fees')
        .update({ settlement_status: 'SUBMITTED' })
        .in('trade_id', tradeIds);
      
      if (feeStatusError) {
        console.error(`❌ Failed to update fee settlement status:`, feeStatusError);
      }

      batchResults.push({
        batchId: batch.id,
        marketId,
        tradesCount: trades.length,
        status: 'SUBMITTED'
      });
    }

    console.log(`✅ Batch settlement complete. Processed ${batchResults.length} batches.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Batch settlement completed',
        batches: batchResults,
        totalTrades: unsettledTrades.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Batch settlement worker error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
