import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topicType, marketId, requestId } = await req.json()

    switch (action) {
      case 'create_topic': {
        const newRequestId = crypto.randomUUID()

        const { error } = await supabase.from('topic_creation_jobs').insert({
          request_id: newRequestId,
          topic_type: topicType,
          market_id: marketId,
          status: 'pending'
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            requestId: newRequestId,
            message: 'Topic creation enqueued. Poll status with action=topic_status.'
          }),
          { headers: corsHeaders, status: 202 }
        )
      }

      case 'topic_status': {
        const { data, error } = await supabase
          .from('topic_creation_jobs')
          .select('*')
          .eq('request_id', requestId)
          .single()

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Job not found' }),
            { headers: corsHeaders, status: 404 }
          )
        }

        return new Response(JSON.stringify(data), {
          headers: corsHeaders,
          status: 200
        })
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: corsHeaders, status: 400 }
        )
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: corsHeaders, status: 500 }
    )
})