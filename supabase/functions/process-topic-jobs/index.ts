import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getSystemHederaClientFromSecrets } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

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

// Progressive polling strategy for mirror node confirmation
async function pollMirrorNodeForJob(
  jobId: string,
  transactionId: string,
  supabase: any,
  maxAttempts: number = 5
): Promise<{ success: boolean; topicId?: string; error?: string }> {
  const delays = [2000, 3000, 5000, 8000, 12000]; // Progressive delays: 2s, 3s, 5s, 8s, 12s
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🔍 Mirror node check ${attempt + 1}/${maxAttempts} for transaction ${transactionId}`)
      
      const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${transactionId}`;
      const response = await fetch(mirrorUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data: MirrorNodeResponse = await response.json();
        
        if (data.transactions && data.transactions.length > 0) {
          const transaction = data.transactions[0];
          
          if (transaction.result === 'SUCCESS' && transaction.entity_id) {
            const topicId = transaction.entity_id;
            
            // Insert into hcs_topics table
            await supabase.from('hcs_topics').insert({
              topic_id: topicId,
              topic_type: (await supabase.from('topic_creation_jobs').select('topic_type, market_id').eq('id', jobId).single()).data.topic_type,
              market_id: (await supabase.from('topic_creation_jobs').select('topic_type, market_id').eq('id', jobId).single()).data.market_id,
              description: `Topic confirmed via mirror node polling`
            });

            // Update job status to confirmed
            await supabase.from('topic_creation_jobs')
              .update({
                status: 'confirmed',
                topic_id: topicId,
                completed_at: new Date().toISOString(),
                mirror_node_checked_at: new Date().toISOString()
              })
              .eq('id', jobId);

            return { success: true, topicId };
          } else if (transaction.result !== 'SUCCESS') {
            // Transaction failed
            await supabase.from('topic_creation_jobs')
              .update({
                status: 'failed',
                error: `Hedera transaction failed: ${transaction.result}`,
                completed_at: new Date().toISOString(),
                mirror_node_checked_at: new Date().toISOString()
              })
              .eq('id', jobId);
            
            return { success: false, error: `Transaction failed: ${transaction.result}` };
          }
        }
      } else if (response.status === 404) {
        console.log(`⏳ Transaction ${transactionId} not yet visible in mirror node (attempt ${attempt + 1})`)
      } else {
        console.log(`⚠️ Mirror node API error: ${response.status}`)
      }
      
      // Wait before next attempt (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
      
    } catch (err) {
      console.error(`Mirror node polling error (attempt ${attempt + 1}):`, err);
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }
  
  // Update status to submitted (will be picked up by scheduled poller)
  await supabase.from('topic_creation_jobs')
    .update({
      status: 'submitted',
      mirror_node_checked_at: new Date().toISOString(),
      mirror_node_retry_count: maxAttempts
    })
    .eq('id', jobId);
  
  return { success: false, error: 'Timeout waiting for mirror node confirmation' };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async () => {
  try {
    console.log('🔄 Worker started')

    const workerId = crypto.randomUUID() // unique identifier per run

    // Atomically claim 1 job and mark with worker_id
    const { data: jobs, error: claimError } = await supabase.rpc('claim_topic_jobs', {
      limit_count: 1,
      p_worker_id: workerId,
    })

    if (claimError) {
      console.error('Error claiming jobs:', claimError)
      return new Response(
        JSON.stringify({ error: 'Failed to claim jobs' }),
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs available')
      return new Response(JSON.stringify({ message: 'No jobs claimed' }), { status: 200 })
    }

    // Process jobs in the background using EdgeRuntime.waitUntil
    const backgroundProcessing = async () => {
      for (const job of jobs) {
        const startTime = Date.now()
        try {
          console.log(`⚡ Worker ${workerId} processing job ${job.id} (type: ${job.topic_type})`)

          // Update job status to 'connecting' for better tracking
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'connecting',
              updated_at: new Date().toISOString(),
              worker_id: workerId,
            })
            .eq('id', job.id)

          console.log(`🔌 Connecting to Hedera for job ${job.id}...`)
          const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)

          // Update job status to 'submitting' 
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'submitting',
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          console.log(`📤 Submitting ${job.topic_type} topic creation for job ${job.id}...`)
          // Submit transaction and get transaction ID (not topic ID)
          const transactionId = await createCLOBTopic(
            client,
            job.topic_type as 'orders' | 'batches' | 'oracle' | 'disputes',
            job.market_id,
            privateKey
          )

          // Update job with transaction ID - status becomes 'submitted_checking'
          await supabase.from('topic_creation_jobs')
            .update({
              status: 'submitted_checking',
              transaction_id: transactionId,
              submitted_at: new Date().toISOString(),
              worker_id: workerId,
            })
            .eq('id', job.id)

          console.log(`🚀 Job ${job.id} submitted → Transaction: ${transactionId}, now checking mirror node...`)

          // Start mirror node polling for this specific job
          const pollResult = await pollMirrorNodeForJob(job.id, transactionId, supabase)
          const duration = Date.now() - startTime

          if (pollResult.success) {
            console.log(`✅ Job ${job.id} confirmed via mirror node → Topic: ${pollResult.topicId} (duration: ${duration}ms)`)
          } else {
            console.log(`⏳ Job ${job.id} submitted but not yet confirmed, will be picked up by scheduled poller`)
          }

        } catch (err) {
          const duration = Date.now() - startTime
          const errorMessage = (err as Error).message

          console.error(`❌ Job ${job.id} failed after ${duration}ms:`, errorMessage)
          console.error(`Error details:`, {
            name: (err as Error).name,
            message: errorMessage,
            isTimeoutError: errorMessage.includes('timeout') || errorMessage.includes('DEADLINE'),
            jobType: job.topic_type,
            attemptNumber: (job.retry_count || 0) + 1
          })

          // Enhanced retry logic: increment counter, requeue if under limit
          const newRetryCount = (job.retry_count || 0) + 1;
          const maxRetries = job.max_retries || 5; // Increased from 3 to 5 for testnet

          const updateData = {
            retry_count: newRetryCount,
            updated_at: new Date().toISOString(),
            error: errorMessage,
            worker_id: workerId,
          };

          if (newRetryCount < maxRetries) {
            // Still have retries left - requeue job
            await supabase.from('topic_creation_jobs')
              .update({
                ...updateData,
                status: 'pending',
              })
              .eq('id', job.id);

            console.log(`🔁 Job ${job.id} requeued (retry ${newRetryCount}/${maxRetries})`);
          } else {
            // Max retries reached - mark as permanently failed
            await supabase.from('topic_creation_jobs')
              .update({
                ...updateData,
                status: 'failed',
                completed_at: new Date().toISOString(),
                duration,
              })
              .eq('id', job.id);

            console.log(`💀 Job ${job.id} permanently failed after ${newRetryCount} attempts`);
          }
        }
      }
    }

    // Start background processing
    EdgeRuntime.waitUntil(backgroundProcessing())

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: `Started processing ${jobs.length} job(s)`,
        workerId,
        jobIds: jobs.map(j => j.id)
      }), 
      { status: 200 }
    )

  } catch (err) {
    console.error('Worker runtime error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})