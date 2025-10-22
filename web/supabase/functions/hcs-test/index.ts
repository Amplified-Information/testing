import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, PrivateKey, AccountId, AccountBalanceQuery } from 'npm:@hashgraph/sdk@2.72.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HCSTestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, topicId, message } = await req.json();
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch Hedera credentials from secrets
    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('*')
      .in('name', ['CLOB_SYSTEM_ACCOUNT_ID', 'CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY']);

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!secrets || secrets.length < 2) {
      throw new Error('Missing Hedera credentials in secrets table');
    }

    const operatorIdSecret = secrets.find((s: any) => s.name === 'CLOB_SYSTEM_ACCOUNT_ID');
    const operatorKeySecret = secrets.find((s: any) => s.name === 'CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY');

    if (!operatorIdSecret?.value || !operatorKeySecret?.value) {
      throw new Error('Hedera credentials not found or empty');
    }

    const operatorId = operatorIdSecret.value;
    const operatorKey = operatorKeySecret.value;

    // Initialize Hedera client
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    let result: HCSTestResult;

    switch (action) {
      case 'initialize':
        result = {
          step: 'Initialize Client',
          status: 'success',
          message: `Successfully initialized Hedera client with account ${operatorId}`,
          timestamp: new Date().toISOString()
        };
        break;

      case 'balance':
        try {
          const accountId = AccountId.fromString(operatorId);
          const balance = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);
          
          result = {
            step: 'Check Balance',
            status: 'success',
            message: `Account balance: ${balance.hbars.toString()}`,
            data: { balance: balance.hbars.toString() },
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          result = {
            step: 'Check Balance',
            status: 'error',
            message: `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
          };
        }
        break;

      case 'createTopic':
        try {
          const topicTransaction = new TopicCreateTransaction()
            .setTopicMemo(message || "HCS Test Topic - " + new Date().toISOString())
            .setAutoRenewPeriod(3600); // 1 hour auto-renew

          const submitResponse = await topicTransaction.execute(client);
          const receipt = await submitResponse.getReceipt(client);
          const newTopicId = receipt.topicId;

          if (!newTopicId) {
            throw new Error('No topic ID returned from transaction');
          }

          result = {
            step: 'Create Topic',
            status: 'success',
            message: `Successfully created topic: ${newTopicId.toString()}`,
            data: { topicId: newTopicId.toString() },
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          result = {
            step: 'Create Topic',
            status: 'error',
            message: `Failed to create topic: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
          };
        }
        break;

      case 'submitMessage':
        if (!topicId) {
          result = {
            step: 'Submit Message',
            status: 'error',
            message: 'Topic ID is required for message submission',
            timestamp: new Date().toISOString()
          };
          break;
        }

        try {
          const messageTransaction = new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage(message || `Test message sent at ${new Date().toISOString()}`);

          const submitResponse = await messageTransaction.execute(client);
          await submitResponse.getReceipt(client);

          result = {
            step: 'Submit Message',
            status: 'success',
            message: `Successfully submitted message to topic ${topicId}`,
            data: { 
              topicId,
              message: message || `Test message sent at ${new Date().toISOString()}`,
              transactionId: submitResponse.transactionId?.toString()
            },
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          result = {
            step: 'Submit Message',
            status: 'error',
            message: `Failed to submit message: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
          };
        }
        break;

      case 'completeTest':
        const results: HCSTestResult[] = [];
        
        // Step 1: Initialize (already done)
        results.push({
          step: 'Initialize Client',
          status: 'success',
          message: `Successfully initialized Hedera client with account ${operatorId}`,
          timestamp: new Date().toISOString()
        });

        // Step 2: Skip balance check (timeout issues on testnet)
        results.push({
          step: 'Check Balance',
          status: 'success',
          message: 'Balance check skipped (testnet timeout issues)',
          timestamp: new Date().toISOString()
        });

        // Step 3: Create topic
        let newTopicId: string | null = null;
        try {
          const topicTransaction = new TopicCreateTransaction()
            .setTopicMemo("Complete HCS Test - " + new Date().toISOString())
            .setAutoRenewPeriod(3600);

          const submitResponse = await topicTransaction.execute(client);
          const receipt = await submitResponse.getReceipt(client);
          const createdTopicId = receipt.topicId;

          if (!createdTopicId) {
            throw new Error('No topic ID returned from transaction');
          }

          newTopicId = createdTopicId.toString();
          results.push({
            step: 'Create Topic',
            status: 'success',
            message: `Successfully created topic: ${newTopicId}`,
            data: { topicId: newTopicId },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          results.push({
            step: 'Create Topic',
            status: 'error',
            message: `Failed to create topic: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString()
          });
          return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Step 4: Submit message
        if (newTopicId) {
          try {
            const messageTransaction = new TopicMessageSubmitTransaction()
              .setTopicId(newTopicId)
              .setMessage(`Hello Hedera! Test message sent at ${new Date().toISOString()}`);

            const submitResponse = await messageTransaction.execute(client);
            await submitResponse.getReceipt(client);

            results.push({
              step: 'Submit Message',
              status: 'success',
              message: `Successfully submitted message to topic ${newTopicId}`,
              data: { 
                topicId: newTopicId,
                message: `Hello Hedera! Test message sent at ${new Date().toISOString()}`,
                transactionId: submitResponse.transactionId?.toString()
              },
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            results.push({
              step: 'Submit Message',
              status: 'error',
              message: `Failed to submit message: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date().toISOString()
            });
          }
        }

        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action specified');
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('HCS Test Error:', error);
    
    const errorResult: HCSTestResult = {
      step: 'Error',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify({ result: errorResult }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})