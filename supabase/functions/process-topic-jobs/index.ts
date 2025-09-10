import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getSystemHederaClientFromSecrets } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

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

      for (const job of jobs) {
        const startTime = Date.now()
        try {
          console.log(`⚡ Worker ${workerId} processing job ${job.id}`)

          // Reduced timeout - just for transaction submission (30 seconds)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Transaction submission timeout after 30 seconds')), 30000)
          })

          const jobPromise = (async () => {
            const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)

            // Submit transaction and get transaction ID (not topic ID)
            const transactionId = await createCLOBTopic(
              client,
              job.topic_type as 'orders' | 'batches' | 'oracle' | 'disputes',
              job.market_id,
              privateKey
            )

            const duration = Date.now() - startTime

            // Update job with transaction ID - status becomes 'submitted'
            await supabase.from('topic_creation_jobs')
              .update({
                status: 'submitted',
                transaction_id: transactionId,
                submitted_at: new Date().toISOString(),
                duration,
                worker_id: workerId,
              })
              .eq('id', job.id)

            console.log(`🚀 Job ${job.id} submitted → Transaction: ${transactionId}`)
            return transactionId
          })()

          await Promise.race([jobPromise, timeoutPromise])

        } catch (err) {
        const duration = Date.now() - startTime
        const errorMessage = (err as Error).message

        console.error(`❌ Job ${job.id} failed:`, errorMessage)

        // Retry logic: increment counter, requeue if under limit
        const newRetryCount = (job.retry_count || 0) + 1;
        const maxRetries = job.max_retries || 3;

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

    return new Response(JSON.stringify({ message: `Processed ${jobs.length} job(s)` }), { status: 200 })

  } catch (err) {
    console.error('Worker runtime error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})