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

// Recovery mechanism for jobs stuck in 'submitting' status
async function recoverStuckJobs(stuckJobs: any[], supabase: any) {
  if (!stuckJobs.length) return;
  
  console.log(`🔧 Attempting to recover ${stuckJobs.length} stuck jobs`);
  
  for (const job of stuckJobs) {
    try {
      console.log(`🔧 Recovering stuck job ${job.id}, checking for transactions around ${job.updated_at}`);
      
      // Search for transactions created around the time this job was last updated
      const jobTime = new Date(job.updated_at);
      const searchStart = new Date(jobTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      const searchEnd = new Date(jobTime.getTime() + 15 * 60 * 1000); // 15 minutes after
      
      const startTimestamp = (searchStart.getTime() / 1000).toFixed(9);
      const endTimestamp = (searchEnd.getTime() / 1000).toFixed(9);
      
      // Search Mirror Node for topic creation transactions in this timeframe
      const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=0.0.34&result=success&type=CONSENSUSCREATETOPIC&timestamp=gte:${startTimestamp}&timestamp=lte:${endTimestamp}&limit=50`;
      
      const response = await fetch(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.transactions && data.transactions.length > 0) {
          // Look for transactions that match our job's memo pattern
          const expectedMemo = job.market_id 
            ? `${job.topic_type.toUpperCase()}_${job.market_id}` 
            : job.topic_type.toUpperCase();
          
          for (const tx of data.transactions) {
            let actualMemo = '';
            if (tx.memo_base64) {
              try {
                actualMemo = atob(tx.memo_base64);
              } catch (e) {
                continue;
              }
            }
            
            if (actualMemo === expectedMemo && tx.entity_id) {
              console.log(`🎯 Found matching transaction for stuck job ${job.id}: ${tx.transaction_id} → Topic: ${tx.entity_id}`);
              
              // Insert into hcs_topics table
              await supabase.from('hcs_topics').insert({
                topic_id: tx.entity_id,
                topic_type: job.topic_type,
                market_id: job.market_id,
                description: `${job.topic_type} topic recovered from stuck state`
              });

              // Update job status to confirmed
              await supabase.from('topic_creation_jobs')
                .update({
                  status: 'confirmed',
                  topic_id: tx.entity_id,
                  transaction_id: tx.transaction_id,
                  completed_at: new Date().toISOString(),
                  mirror_node_checked_at: new Date().toISOString()
                })
                .eq('id', job.id);
              
              console.log(`✅ Successfully recovered stuck job ${job.id}`);
              break;
            }
          }
        }
      }
      
    } catch (err) {
      console.error(`Error recovering stuck job ${job.id}:`, err);
      
      // Mark as failed after too many attempts
      const retryCount = (job.retry_count || 0) + 1;
      if (retryCount >= 8) {
        await supabase.from('topic_creation_jobs')
          .update({
            status: 'failed',
            error: `Failed to recover stuck job after ${retryCount} attempts: ${(err as Error).message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
        
        console.log(`💀 Marked stuck job ${job.id} as permanently failed`);
      } else {
        await supabase.from('topic_creation_jobs')
          .update({
            retry_count: retryCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Mirror Node poller started')

    // Get jobs that have been submitted or are stuck in submitting status
    const { data: jobsToCheck, error: fetchError } = await supabase
      .from('topic_creation_jobs')
      .select('*')
      .in('status', ['submitted', 'submitted_checking'])
      .not('transaction_id', 'is', null)
      .order('submitted_at', { ascending: true })
      .limit(30); // Process up to 30 jobs at a time

    // Also check for jobs stuck in 'submitting' status for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckJobs, error: stuckError } = await supabase
      .from('topic_creation_jobs')
      .select('*')
      .eq('status', 'submitting')
      .lt('updated_at', fiveMinutesAgo)
      .not('transaction_id', 'is', null)
      .limit(10);

    if (stuckError) {
      console.error('Error fetching stuck jobs:', stuckError);
    }

    // Combine all jobs to check
    const allJobs = [...(jobsToCheck || []), ...(stuckJobs || [])];
    
    if (fetchError && !stuckError) {
      console.error('Error fetching jobs:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jobs' }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (fetchError) {
      console.error('Error fetching submitted jobs:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jobs' }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (!allJobs || allJobs.length === 0) {
      console.log('No jobs to check')
      return new Response(
        JSON.stringify({ message: 'No jobs to poll', checked: 0 }),
        { status: 200, headers: corsHeaders }
      )
    }

    console.log(`📋 Found ${allJobs.length} jobs to check (${jobsToCheck?.length || 0} submitted/checking + ${stuckJobs?.length || 0} stuck)`)
    
    // First, try to recover stuck jobs by searching mirror node
    await recoverStuckJobs(stuckJobs || [], supabase);

    let confirmedCount = 0;
    let failedCount = 0;
    let stillPendingCount = 0;

    for (const job of allJobs) {
      try {
        console.log(`🔎 Checking transaction ${job.transaction_id} for job ${job.id}`)

        // Multiple mirror nodes with fallback support
        const mirrorNodes = [
          'https://testnet.mirrornode.hedera.com',
          'https://mainnet-public.mirrornode.hedera.com', 
          'https://hashio.io/api/testnet'
        ];
        
        let response;
        let lastError;
        
        // Try each mirror node until one succeeds
        for (const mirrorNode of mirrorNodes) {
          try {
            const mirrorUrl = `${mirrorNode}/api/v1/transactions/${job.transaction_id}`;
            response = await fetch(mirrorUrl, {
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(8000)
            });
            
            if (response.ok || response.status === 404) {
              break; // Success or expected 404, stop trying other nodes
            }
          } catch (err) {
            lastError = err;
            console.log(`⚠️ Mirror node ${mirrorNode} failed, trying next...`);
            continue;
          }
        }
        
        if (!response) {
          throw lastError || new Error('All mirror nodes failed');
        }

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
      message: 'Enhanced Mirror Node polling complete',
      total_checked: allJobs.length,
      submitted_jobs: jobsToCheck?.length || 0,
      stuck_jobs_recovered: stuckJobs?.length || 0,
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