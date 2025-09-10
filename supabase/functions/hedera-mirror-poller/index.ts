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

    // Get jobs that have been submitted but not yet confirmed
    const { data: submittedJobs, error: fetchError } = await supabase
      .from('topic_creation_jobs')
      .select('*')
      .eq('status', 'submitted')
      .not('transaction_id', 'is', null)
      .order('submitted_at', { ascending: true })
      .limit(20); // Process up to 20 jobs at a time

    if (fetchError) {
      console.error('Error fetching submitted jobs:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jobs' }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (!submittedJobs || submittedJobs.length === 0) {
      console.log('No submitted jobs to check')
      return new Response(
        JSON.stringify({ message: 'No submitted jobs to poll', checked: 0 }),
        { status: 200, headers: corsHeaders }
      )
    }

    console.log(`📋 Found ${submittedJobs.length} jobs to check`)

    let confirmedCount = 0;
    let failedCount = 0;
    let stillPendingCount = 0;

    for (const job of submittedJobs) {
      try {
        console.log(`🔎 Checking transaction ${job.transaction_id} for job ${job.id}`)

        // Query Hedera Mirror Node
        const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${job.transaction_id}`;
        
        const response = await fetch(mirrorUrl, {
          headers: {
            'Accept': 'application/json',
          },
          // 10 second timeout for each Mirror Node request
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Transaction not yet visible in Mirror Node
            console.log(`⏳ Transaction ${job.transaction_id} not yet in Mirror Node`)
            stillPendingCount++;
            
            // Update mirror node check timestamp
            await supabase.from('topic_creation_jobs')
              .update({
                mirror_node_checked_at: new Date().toISOString(),
                mirror_node_retry_count: (job.mirror_node_retry_count || 0) + 1
              })
              .eq('id', job.id);

            continue;
          }
          
          throw new Error(`Mirror Node API error: ${response.status}`);
        }

        const data: MirrorNodeResponse = await response.json();
        
        if (!data.transactions || data.transactions.length === 0) {
          console.log(`⏳ No transaction data yet for ${job.transaction_id}`)
          stillPendingCount++;
          continue;
        }

        const transaction = data.transactions[0];

        if (transaction.result === 'SUCCESS') {
          // Transaction succeeded - extract topic ID from entity_id
          const topicId = transaction.entity_id;
          
          if (!topicId) {
            throw new Error('Successful transaction but no entity_id found');
          }

          console.log(`✅ Transaction confirmed - Topic created: ${topicId}`);

          // Insert into hcs_topics table
          await supabase.from('hcs_topics').insert({
            topic_id: topicId,
            topic_type: job.topic_type,
            market_id: job.market_id,
            description: `${job.topic_type} topic${job.market_id ? ` for market ${job.market_id}` : ''}`
          });

          // Update job status to confirmed
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'confirmed',
              topic_id: topicId,
              completed_at: new Date().toISOString(),
              mirror_node_checked_at: new Date().toISOString()
            })
            .eq('id', job.id);

          confirmedCount++;
          console.log(`🎉 Job ${job.id} confirmed → Topic: ${topicId}`);

        } else {
          // Transaction failed
          console.log(`❌ Transaction failed with result: ${transaction.result}`);
          
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'failed',
              error: `Hedera transaction failed: ${transaction.result}`,
              completed_at: new Date().toISOString(),
              mirror_node_checked_at: new Date().toISOString()
            })
            .eq('id', job.id);

          failedCount++;
        }

      } catch (err) {
        console.error(`Error checking job ${job.id}:`, err);
        
        // Check if we should give up on this job
        const retryCount = (job.mirror_node_retry_count || 0) + 1;
        const maxRetries = 20; // Allow more retries since we're just polling
        
        if (retryCount >= maxRetries) {
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'failed',
              error: `Mirror Node polling failed after ${maxRetries} attempts: ${(err as Error).message}`,
              completed_at: new Date().toISOString(),
              mirror_node_checked_at: new Date().toISOString(),
              mirror_node_retry_count: retryCount
            })
            .eq('id', job.id);
          
          failedCount++;
          console.log(`💀 Job ${job.id} failed after ${maxRetries} Mirror Node attempts`);
        } else {
          await supabase.from('topic_creation_jobs')
            .update({
              mirror_node_checked_at: new Date().toISOString(),
              mirror_node_retry_count: retryCount
            })
            .eq('id', job.id);
          
          stillPendingCount++;
        }
      }
    }

    const summary = {
      message: 'Mirror Node polling complete',
      total_checked: submittedJobs.length,
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