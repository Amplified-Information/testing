import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getSystemHederaClientFromSecrets } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role needed
  )

  console.log('[Topic Jobs Worker] Starting job processing batch...')

  const { data: jobs, error } = await supabase
    .from('topic_creation_jobs')
    .select('*')
    .eq('status', 'pending')
    .limit(5)

  if (error) {
    console.error('[Topic Jobs Worker] Error fetching jobs', error)
    return new Response('Error fetching jobs', { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    console.log('[Topic Jobs Worker] No pending jobs found')
    return new Response('No pending jobs', { status: 200 })
  }

  console.log(`[Topic Jobs Worker] Processing ${jobs.length} jobs`)

  for (const job of jobs) {
    const start = Date.now()
    
    try {
      console.log(`[Topic Jobs Worker] Processing job ${job.request_id} - ${job.topic_type}`)
      
      // Update status to processing
      await supabase.from('topic_creation_jobs')
        .update({ status: 'processing' })
        .eq('id', job.id)

      const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)

      const topicId = await createCLOBTopic(
        client,
        job.topic_type as 'orders' | 'batches' | 'oracle' | 'disputes',
        job.market_id,
        privateKey
      )

      // Store the topic in hcs_topics table
      const { error: hcsError } = await supabase
        .from('hcs_topics')
        .insert({
          topic_id: topicId,
          topic_type: job.topic_type,
          market_id: job.market_id,
          description: `CLOB ${job.topic_type} topic${job.market_id ? ` for market ${job.market_id}` : ''}`
        })

      if (hcsError) {
        console.error(`[Topic Jobs Worker] Failed to store topic in hcs_topics for job ${job.request_id}`, hcsError)
      }

      await supabase.from('topic_creation_jobs')
        .update({
          status: 'success',
          topic_id: topicId,
          duration: Date.now() - start,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      console.log(`[Topic Jobs Worker] ✅ Created topic ${topicId} for job ${job.request_id}`)
      
    } catch (err) {
      console.error(`[Topic Jobs Worker] ❌ Topic creation failed for job ${job.request_id}`, err)

      await supabase.from('topic_creation_jobs')
        .update({
          status: 'failed',
          error: (err as Error).message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
    }
  }

  console.log('[Topic Jobs Worker] Batch processing completed')
  return new Response('Processed jobs', { status: 200 })
})