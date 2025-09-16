import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MirrorNodeTransaction {
  transaction_id: string;
  result: string;
  consensus_timestamp: string;
  entity_id?: string;
  memo_base64?: string;
}

interface MirrorNodeResponse {
  transactions: MirrorNodeTransaction[];
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Mirror Node poller started')

    // Find topics that have been submitted but not yet confirmed (topic_id is NULL but submitted_at is not NULL)
    const { data: unconfirmedTopics, error: fetchError } = await supabase
      .from('hcs_topics')
      .select('*')
      .is('topic_id', null)
      .not('submitted_at', 'is', null)
      .eq('is_active', false)
      .order('submitted_at', { ascending: true })
      .limit(50); // Process up to 50 topics at a time

    if (fetchError) {
      console.error('Error fetching unconfirmed topics:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch unconfirmed topics' }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (!unconfirmedTopics || unconfirmedTopics.length === 0) {
      console.log('No unconfirmed topics to check')
      return new Response(
        JSON.stringify({ message: 'No unconfirmed topics found', checked: 0 }),
        { status: 200, headers: corsHeaders }
      )
    }

    console.log(`📋 Found ${unconfirmedTopics.length} unconfirmed topics to check`)
    
    // Search recent transactions on mirror node for CONSENSUSCREATETOPIC
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const startTimestamp = (thirtyMinutesAgo.getTime() / 1000).toFixed(9);
    
    console.log(`🔍 Searching for recent CONSENSUSCREATETOPIC transactions since ${thirtyMinutesAgo.toISOString()}`)
    
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions?transactiontype=CONSENSUSCREATETOPIC&timestamp=gte:${startTimestamp}&order=desc&limit=100`;
    
    let recentTransactions = [];
    try {
      const response = await fetch(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        recentTransactions = data.transactions || [];
        console.log(`📦 Found ${recentTransactions.length} recent topic creation transactions`)
      } else {
        console.error(`❌ Mirror node API error: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
    }

    let confirmedCount = 0;
    let failedCount = 0;
    let stillPendingCount = 0;

    // Match unconfirmed topics with recent transactions
    for (const topic of unconfirmedTopics) {
      try {
        console.log(`🔎 Looking for HCS topic ID for ${topic.topic_type} topic (DB ID: ${topic.id})`)
        
        // Build expected memo pattern
        const expectedMemo = topic.market_id 
          ? `${topic.topic_type.toUpperCase()}_${topic.market_id}` 
          : topic.topic_type.toUpperCase();
        
        console.log(`🎯 Expected memo pattern: "${expectedMemo}"`)
        
        // Find matching transaction by memo and timing
        let matchedTransaction = null;
        
        for (const tx of recentTransactions) {
          let actualMemo = '';
          if (tx.memo_base64) {
            try {
              actualMemo = atob(tx.memo_base64);
            } catch (e) {
              continue;
            }
          }
          
          // Check if memo matches our expected pattern
          if (actualMemo === expectedMemo && tx.entity_id) {
            // Additional timing check - transaction should be after topic's submitted_at
            const txTimestamp = new Date(parseFloat(tx.consensus_timestamp) * 1000);
            const topicSubmittedAt = new Date(topic.submitted_at);
            
            // Allow some margin for clock differences (5 minutes before, 30 minutes after)
            const marginBefore = 5 * 60 * 1000; // 5 minutes
            const marginAfter = 30 * 60 * 1000; // 30 minutes
            
            if (txTimestamp >= new Date(topicSubmittedAt.getTime() - marginBefore) && 
                txTimestamp <= new Date(topicSubmittedAt.getTime() + marginAfter)) {
              
              matchedTransaction = tx;
              console.log(`🎯 Found matching transaction for topic ${topic.id}: ${tx.transaction_id} → HCS Topic: ${tx.entity_id}`);
              break;
            }
          }
        }
        
        if (matchedTransaction) {
          // Update the topic record with the HCS topic ID
          const { error: updateError } = await supabase.from('hcs_topics')
            .update({
              topic_id: matchedTransaction.entity_id,
              is_active: true,
              description: `${topic.topic_type} topic${topic.market_id ? ` for market ${topic.market_id}` : ''} - confirmed via mirror node`,
              updated_at: new Date().toISOString()
            })
            .eq('id', topic.id);
          
          if (updateError) {
            console.error(`❌ Failed to update topic ${topic.id} with HCS ID ${matchedTransaction.entity_id}:`, updateError);
            failedCount++;
          } else {
            console.log(`✅ Successfully confirmed topic ${topic.id} → HCS Topic: ${matchedTransaction.entity_id}`);
            confirmedCount++;
            
            // Also update any related job if exists
            await supabase.from('topic_creation_jobs')
              .update({
                status: 'confirmed',
                topic_id: matchedTransaction.entity_id,
                transaction_id: matchedTransaction.transaction_id,
                completed_at: new Date().toISOString(),
                mirror_node_checked_at: new Date().toISOString()
              })
              .eq('topic_type', topic.topic_type)
              .eq('market_id', topic.market_id)
              .in('status', ['submitted', 'submitted_checking']);
          }
        } else {
          console.log(`⏳ No matching transaction found yet for topic ${topic.id} (${expectedMemo})`);
          stillPendingCount++;
          
          // Check if topic is too old (older than 1 hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const topicSubmittedAt = new Date(topic.submitted_at);
          
          if (topicSubmittedAt < oneHourAgo) {
            console.log(`⚠️ Topic ${topic.id} is older than 1 hour, marking as potentially failed`);
            await supabase.from('hcs_topics')
              .update({
                description: `${topic.topic_type} topic${topic.market_id ? ` for market ${topic.market_id}` : ''} - timeout waiting for confirmation`,
                updated_at: new Date().toISOString()
              })
              .eq('id', topic.id);
          }
        }

      } catch (err) {
        console.error(`Error processing topic ${topic.id}:`, err);
        failedCount++;
      }
    }

    const summary = {
      message: 'Mirror Node polling complete - searching for HCS topic IDs',
      total_checked: unconfirmedTopics.length,
      recent_transactions_found: recentTransactions.length,
      confirmed: confirmedCount,
      failed: failedCount,
      still_pending: stillPendingCount
    };

    console.log('📊 Polling summary:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Mirror Node poller error:', err)
    return new Response(
      JSON.stringify({ 
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})