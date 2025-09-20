import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Client, PrivateKey, TopicCreateTransaction } from 'https://esm.sh/@hashgraph/sdk@2.72.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting HCS topic creation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request data
    const { memo, topicType = 'general' } = await req.json();
    console.log('📝 Request data:', { memo, topicType });

    // Get Hedera credentials from secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('secrets')
      .select('name, value')
      .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY']);

    if (secretsError || !secrets || secrets.length !== 2) {
      throw new Error('Failed to fetch Hedera credentials from secrets');
    }

    const operatorId = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID')?.value;
    const operatorKey = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY')?.value;

    if (!operatorId || !operatorKey) {
      throw new Error('Missing Hedera operator credentials');
    }

    console.log('🔑 Retrieved Hedera credentials, operator:', operatorId);

    // 1. Insert pending request
    const { data: request, error: insertError } = await supabase
      .from('hcs_requests')
      .insert([{ 
        memo: memo || `${topicType} topic created at ${new Date().toISOString()}`,
        status: 'pending' 
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert request:', insertError);
      throw insertError;
    }

    console.log('📊 Created request record:', request.id);

    // 2. Initialize Hedera client with optimized settings
    const privateKey = PrivateKey.fromString(operatorKey);
    const client = Client.forTestnet()
      .setOperator(operatorId, privateKey)
      .setRequestTimeout(30000) // 30 second timeout
      .setGrpcDeadline(25000);  // 25 second gRPC deadline

    console.log('🌐 Initialized Hedera client');

    try {
      // 3. Create HCS topic and wait for receipt
      console.log('🔄 Creating topic transaction...');
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(request.memo)
        .setAutoRenewPeriod(7890000) // ~3 months
        .freezeWith(client);

      console.log('📤 Executing transaction...');
      const txResponse = await transaction.execute(client);
      
      console.log('⏳ Getting receipt...');
      const receipt = await txResponse.getReceipt(client);
      const topicId = receipt.topicId!.toString();

      console.log('✅ Topic created successfully:', topicId);

      // 4. Update with topic_id and mark as created
      const { error: updateError } = await supabase
        .from('hcs_requests')
        .update({ 
          topic_id: topicId,
          status: 'created' // Mark as created since we have the receipt
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('❌ Failed to update request:', updateError);
        throw updateError;
      }

      // 5. Queue mirror node polling for final confirmation
      console.log('📤 Triggering mirror node polling...');
      await supabase.functions.invoke('poll-hcs-mirror', {
        body: { requestId: request.id, topicId }
      });

      console.log('🎉 Topic creation completed successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          requestId: request.id, 
          topicId,
          status: 'created'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (hederaError) {
      console.error('❌ Hedera transaction failed:', hederaError);
      
      // Update request with error
      await supabase
        .from('hcs_requests')
        .update({ 
          status: 'failed',
          error_message: (hederaError as Error).message
        })
        .eq('id', request.id);

      throw hederaError;
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
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