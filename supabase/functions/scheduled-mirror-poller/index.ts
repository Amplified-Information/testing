import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    console.log('🕒 Scheduled mirror node poller triggered')

    // Call the main mirror node poller function
    const response = await supabase.functions.invoke('hedera-mirror-poller', {
      body: { 
        trigger: 'scheduled',
        timestamp: new Date().toISOString()
      }
    });

    if (response.error) {
      console.error('Error calling mirror node poller:', response.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to trigger mirror node poller',
          details: response.error
        }),
        { status: 500 }
      );
    }

    console.log('✅ Scheduled mirror node poller completed:', response.data);

    return new Response(
      JSON.stringify({ 
        message: 'Scheduled mirror node polling completed',
        result: response.data,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Scheduled poller error:', err);
    return new Response(
      JSON.stringify({ 
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
});