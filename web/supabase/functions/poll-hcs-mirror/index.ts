import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIRROR_URL = 'https://testnet.mirrornode.hedera.com/api/v1/topics';
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000; // 5 seconds

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting mirror node polling...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, topicId, retryCount = 0 } = await req.json();
    console.log('📊 Polling data:', { requestId, topicId, retryCount });

    if (retryCount >= MAX_RETRIES) {
      console.log('⚠️ Max retries reached, giving up');
      await supabase
        .from('hcs_requests')
        .update({ 
          status: 'failed',
          error_message: `Mirror node confirmation failed after ${MAX_RETRIES} retries`
        })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({ success: false, error: 'Max retries exceeded' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      console.log(`🌐 Checking mirror node for topic: ${topicId}`);
      const mirrorResponse = await fetch(`${MIRROR_URL}/${topicId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (mirrorResponse.ok) {
        const topicData = await mirrorResponse.json();
        console.log('✅ Topic confirmed on mirror node:', topicData.topic_id);

        // Update status to mirror_confirmed
        const { error: updateError } = await supabase
          .from('hcs_requests')
          .update({ 
            status: 'mirror_confirmed',
            mirror_confirmed_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('❌ Failed to update confirmation:', updateError);
        }

        return new Response(
          JSON.stringify({ success: true, confirmed: true, topicData }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      } else if (mirrorResponse.status === 404) {
        console.log(`⏳ Topic ${topicId} not found yet (attempt ${retryCount + 1}/${MAX_RETRIES}), will retry...`);

        // Schedule retry using background task
        const retryPayload = { requestId, topicId, retryCount: retryCount + 1 };
        
        // Use setTimeout to delay the retry
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('poll-hcs-mirror', {
              body: retryPayload
            });
          } catch (retryError) {
            console.error('❌ Failed to schedule retry:', retryError);
          }
        }, RETRY_DELAY_MS);

        return new Response(
          JSON.stringify({ success: true, confirmed: false, willRetry: true }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      } else {
        throw new Error(`Mirror node responded with status: ${mirrorResponse.status}`);
      }

    } catch (mirrorError) {
      console.error('❌ Mirror node request failed:', mirrorError);
      
      // Schedule retry for transient errors
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Scheduling retry ${retryCount + 1}/${MAX_RETRIES}...`);
        
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('poll-hcs-mirror', {
              body: { requestId, topicId, retryCount: retryCount + 1 }
            });
          } catch (retryError) {
            console.error('❌ Failed to schedule retry:', retryError);
          }
        }, RETRY_DELAY_MS);

        return new Response(
          JSON.stringify({ success: true, confirmed: false, willRetry: true, error: (mirrorError as Error).message }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Final failure
        await supabase
          .from('hcs_requests')
          .update({ 
            status: 'failed',
            error_message: `Mirror polling failed: ${(mirrorError as Error).message}`
          })
          .eq('id', requestId);

        throw mirrorError;
      }
    }

  } catch (error) {
    console.error('❌ Polling failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});