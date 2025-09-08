import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log(`HCS Manager - Received ${req.method} request`)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Debug environment variables
    console.log('Environment variables check:')
    console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET')
    console.log('CLOB_SYSTEM_ACCOUNT_ID:', Deno.env.get('CLOB_SYSTEM_ACCOUNT_ID') ? 'SET' : 'NOT SET')
    console.log('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY:', Deno.env.get('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY') ? 'SET' : 'NOT SET')

    const systemAccountId = Deno.env.get('CLOB_SYSTEM_ACCOUNT_ID')
    const systemAccountPrivateKey = Deno.env.get('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY')

    if (!systemAccountId || !systemAccountPrivateKey) {
      console.error('Missing Hedera credentials:', {
        systemAccountId: systemAccountId ? 'SET' : 'MISSING',
        systemAccountPrivateKey: systemAccountPrivateKey ? 'SET' : 'MISSING'
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing Hedera credentials',
          details: {
            systemAccountId: systemAccountId ? 'SET' : 'MISSING',
            systemAccountPrivateKey: systemAccountPrivateKey ? 'SET' : 'MISSING'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'GET') {
      console.log('Processing GET request for HCS topics')
      // Simple GET endpoint to test
      const { data: topics, error } = await supabase
        .from('hcs_topics')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to fetch topics: ' + error.message)
      }

      console.log(`Found ${topics?.length || 0} HCS topics`)
      return new Response(
        JSON.stringify({ topics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      console.log('Processing POST request')
      const { action } = await req.json()
      console.log('Action:', action)
      
      // For now, just return success to test basic functionality
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'HCS Manager is working',
          action,
          credentials: {
            accountId: systemAccountId,
            hasPrivateKey: !!systemAccountPrivateKey
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('HCS Manager error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})