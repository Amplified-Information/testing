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
    console.log('🔄 Worker started: attempting to claim jobs...')

    // Atomically claim jobs in one SQL call (reduced to 1 for better timeout handling)
    const { data: jobs, error: claimError } = await supabase.rpc(
      'claim_topic_jobs',
      { limit_count: 1 }
    )

    if (claimError) {
      console.error('Error claiming jobs:', claimError)
      return new Response(
        JSON.stringify({ error: 'Failed to claim jobs' }),
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs available to process.')
      return new Response(JSON.stringify({ message: 'No jobs claimed' }), { status: 200 })
    }

    console.log(`✅ Claimed ${jobs.length} job(s)`)

    // Process each claimed job with timeout protection
    for (const job of jobs) {
      const startTime = Date.now()
      try {
        console.log(`Processing job ${job.id} (${job.topic_type})`)

        // Add timeout protection - fail job if it takes longer than 2 minutes
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Job timeout after 120 seconds')), 120000)
        })

        const jobPromise = (async () => {
          const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)

          const topicId = await createCLOBTopic(
            client,
            job.topic_type as 'orders' | 'batches' | 'oracle' | 'disputes',
            job.market_id,
            privateKey
          )

          const duration = Date.now() - startTime

          // Insert into hcs_topics table
          await supabase.from('hcs_topics').insert({
            topic_id: topicId,
            topic_type: job.topic_type,
            market_id: job.market_id,
            description: `${job.topic_type} topic${job.market_id ? ` for market ${job.market_id}` : ''}`
          })

          // Mark job as success
          await supabase
            .from('topic_creation_jobs')
            .update({
              status: 'success',
              topic_id: topicId,
              completed_at: new Date().toISOString(),
              duration
            })
            .eq('id', job.id)

          console.log(`🎉 Job ${job.id} succeeded in ${duration}ms → ${topicId}`)
          return topicId
        })()

        await Promise.race([jobPromise, timeoutPromise])

      } catch (err) {
        const duration = Date.now() - startTime
        const errorMessage = (err as Error).message

        console.error(`❌ Job ${job.id} failed:`, errorMessage)

        // Mark job as failed with proper error handling
        await supabase
          .from('topic_creation_jobs')
          .update({
            status: 'failed',
            error: errorMessage,
            completed_at: new Date().toISOString(),
            duration
          })
          .eq('id', job.id)
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${jobs.length} job(s)` }), { status: 200 })

  } catch (err) {
    console.error('Worker runtime error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})