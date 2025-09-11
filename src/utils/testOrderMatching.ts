import { supabase } from '@/integrations/supabase/client';

export async function triggerOrderMatchingTest() {
  console.log('🚀 Starting order matching test...');
  
  try {
    // First, check queued orders
    const { data: queuedOrders } = await supabase
      .from('order_queue')
      .select('*')
      .eq('market_id', 'af539f2d-8a88-4f04-9ed8-b5604cb9591c')
      .eq('status', 'QUEUED')
      .order('priority_score');
    
    console.log(`📋 Found ${queuedOrders?.length || 0} queued orders`);
    
    // Trigger the order matcher
    const { data: matcherResult, error: matcherError } = await supabase.functions.invoke('order-matcher', {
      body: { 
        trigger: 'manual_test',
        marketId: 'af539f2d-8a88-4f04-9ed8-b5604cb9591c'
      }
    });

    if (matcherError) {
      console.error('❌ Order matcher error:', matcherError);
      return { success: false, error: matcherError };
    }

    console.log('✅ Order matcher completed:', matcherResult);

    // Check the results
    const results = await checkMatchingResults();
    
    return { 
      success: true, 
      matcherResult,
      ...results 
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

async function checkMatchingResults() {
  const marketId = 'af539f2d-8a88-4f04-9ed8-b5604cb9591c';
  
  // Check processed orders
  const { data: processedOrders } = await supabase
    .from('order_queue')
    .select('*')
    .eq('market_id', marketId)
    .neq('status', 'QUEUED');
    
  console.log(`📊 Processed ${processedOrders?.length || 0} orders`);
  
  // Check active orders in CLOB
  const { data: activeOrders } = await supabase
    .from('clob_orders')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false });
    
  console.log(`📈 Created ${activeOrders?.length || 0} active orders`);
  
  // Check trades generated
  const { data: trades } = await supabase
    .from('clob_trades')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false });
    
  console.log(`💰 Generated ${trades?.length || 0} trades`);
  
  // Check positions created
  const { data: positions } = await supabase
    .from('clob_positions')
    .select('*')
    .eq('market_id', marketId);
    
  console.log(`👥 Created ${positions?.length || 0} positions`);
  
  // Check order book state
  const { data: sequencerState } = await supabase
    .from('sequencer_state')
    .select('*')
    .eq('market_id', marketId)
    .single();
    
  if (sequencerState) {
    const bids = (sequencerState.bid_levels as any[]) || [];
    const asks = (sequencerState.ask_levels as any[]) || [];
    console.log(`📚 Order book: ${bids.length} bid levels, ${asks.length} ask levels`);
  }
  
  return {
    processedOrders: processedOrders?.length || 0,
    activeOrders: activeOrders?.length || 0,
    tradesGenerated: trades?.length || 0,
    positionsCreated: positions?.length || 0,
    orderBookLevels: sequencerState ? {
      bids: ((sequencerState.bid_levels as any[]) || []).length,
      asks: ((sequencerState.ask_levels as any[]) || []).length
    } : null,
    trades: trades?.slice(0, 5), // Show first 5 trades
    orderBook: sequencerState
  };
}

// Export for console usage
(window as any).triggerOrderMatchingTest = triggerOrderMatchingTest;