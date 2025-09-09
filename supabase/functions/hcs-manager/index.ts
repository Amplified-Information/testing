import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

// Initialize service role client for accessing secrets
const supabaseServiceRole = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topicType, marketId, requestId } = await req.json()
    console.log(`HCS Manager received action: ${action}`)

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

      case 'get-credentials': {
        console.log('Processing get-credentials request...')
        
        // Fetch Hedera credentials from secrets table using service role
        const { data, error } = await supabaseServiceRole
          .from('secrets')
          .select('name, value')
          .in('name', ['CLOB_SYSTEM_ACCOUNT_ID', 'CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY'])

        console.log('Secrets query result:', { data, error })

        if (error) {
          console.error('Secrets query error:', error)
          return new Response(
            JSON.stringify({ success: false, error: `Failed to fetch credentials: ${error.message}` }),
            { headers: corsHeaders, status: 500 }
          )
        }

        if (!data || data.length < 2) {
          console.error('Insufficient credentials found:', data)
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required Hedera credentials' }),
            { headers: corsHeaders, status: 404 }
          )
        }

        const credentials: Record<string, string> = {}
        data.forEach(secret => {
          credentials[secret.name] = secret.value
        })

        console.log('Parsed credentials keys:', Object.keys(credentials))

        if (!credentials.CLOB_SYSTEM_ACCOUNT_ID || !credentials.CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY) {
          console.error('Incomplete credentials:', Object.keys(credentials))
          return new Response(
            JSON.stringify({ success: false, error: 'Incomplete Hedera credentials' }),
            { headers: corsHeaders, status: 404 }
          )
        }

        console.log('Successfully returning credentials')
        return new Response(
          JSON.stringify({
            success: true,
            operatorId: credentials.CLOB_SYSTEM_ACCOUNT_ID,
            operatorKey: credentials.CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY
          }),
          { headers: corsHeaders, status: 200 }
        )
      }

      case 'reset_stuck_jobs': {
        // Reset jobs that have been processing for more than 5 minutes
        const { data, error } = await supabase
          .from('topic_creation_jobs')
          .update({
            status: 'pending',
            claimed_at: null,
            updated_at: new Date().toISOString()
          })
          .lt('claimed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .eq('status', 'processing')
          .select('id, topic_type')

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: corsHeaders, status: 500 }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Reset ${data?.length || 0} stuck jobs to pending status`,
            resetJobs: data
          }),
          { headers: corsHeaders, status: 200 }
        )
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
  }
})