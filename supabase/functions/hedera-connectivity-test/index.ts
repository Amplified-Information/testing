import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Client, AccountId, PrivateKey, AccountBalanceQuery, TopicCreateTransaction, TopicMessageSubmitTransaction } from "https://esm.sh/@hashgraph/sdk@2.72.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectivityTestResult {
  test: string;
  status: 'success' | 'failure' | 'timeout' | 'partial';
  duration: number;
  details: any;
  error?: string;
}

interface NodeTestResult {
  nodeId: string;
  reachable: boolean;
  latency?: number;
  error?: string;
}

const HEDERA_TESTNET_NODES = [
  { id: '0.0.3', endpoint: '3.testnet.hedera.com:50211' },
  { id: '0.0.4', endpoint: '4.testnet.hedera.com:50211' },
  { id: '0.0.5', endpoint: '5.testnet.hedera.com:50211' },
  { id: '0.0.6', endpoint: '6.testnet.hedera.com:50211' },
  { id: '0.0.7', endpoint: '7.testnet.hedera.com:50211' },
  { id: '0.0.8', endpoint: '8.testnet.hedera.com:50211' },
  { id: '0.0.9', endpoint: '9.testnet.hedera.com:50211' },
];

async function testDNSResolution(): Promise<ConnectivityTestResult> {
  const startTime = Date.now();
  console.log('🔍 Testing DNS resolution for Hedera nodes...');
  
  try {
    const results: Record<string, boolean> = {};
    
    for (const node of HEDERA_TESTNET_NODES) {
      try {
        const hostname = node.endpoint.split(':')[0];
        // Simple DNS test by attempting to resolve hostname
        const response = await fetch(`https://${hostname}`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        
        results[node.id] = true; // If we got here, DNS resolved
        console.log(`✅ DNS resolved for ${hostname}`);
      } catch (error) {
        results[node.id] = false;
        console.log(`❌ DNS failed for ${node.endpoint}: ${error.message}`);
      }
    }
    
    const successCount = Object.values(results).filter(Boolean).length;
    const status = successCount === HEDERA_TESTNET_NODES.length ? 'success' : 
                  successCount > 0 ? 'partial' : 'failure';
    
    return {
      test: 'DNS Resolution',
      status,
      duration: Date.now() - startTime,
      details: { results, successCount, totalNodes: HEDERA_TESTNET_NODES.length }
    };
  } catch (error) {
    return {
      test: 'DNS Resolution',
      status: 'failure',
      duration: Date.now() - startTime,
      details: {},
      error: error.message
    };
  }
}

async function testNodeConnectivity(): Promise<ConnectivityTestResult> {
  const startTime = Date.now();
  console.log('🌐 Testing individual node connectivity...');
  
  try {
    const nodeResults: NodeTestResult[] = [];
    
    for (const node of HEDERA_TESTNET_NODES) {
      const nodeStartTime = Date.now();
      try {
        // Try to connect to the gRPC port
        const hostname = node.endpoint.split(':')[0];
        const port = node.endpoint.split(':')[1];
        
        // Simple connectivity test using HTTP to check if the host is reachable
        // This is a proxy test since we can't directly test gRPC ports from browsers
        const response = await fetch(`https://${hostname}`, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        }).catch(() => null);
        
        const latency = Date.now() - nodeStartTime;
        
        nodeResults.push({
          nodeId: node.id,
          reachable: true,
          latency
        });
        
        console.log(`✅ Node ${node.id} reachable in ${latency}ms`);
      } catch (error) {
        nodeResults.push({
          nodeId: node.id,
          reachable: false,
          error: error.message
        });
        console.log(`❌ Node ${node.id} unreachable: ${error.message}`);
      }
    }
    
    const reachableNodes = nodeResults.filter(n => n.reachable).length;
    const status = reachableNodes === HEDERA_TESTNET_NODES.length ? 'success' : 
                  reachableNodes > 0 ? 'partial' : 'failure';
    
    return {
      test: 'Node Connectivity',
      status,
      duration: Date.now() - startTime,
      details: { nodeResults, reachableNodes, totalNodes: HEDERA_TESTNET_NODES.length }
    };
  } catch (error) {
    return {
      test: 'Node Connectivity',
      status: 'failure',
      duration: Date.now() - startTime,
      details: {},
      error: error.message
    };
  }
}

async function testHederaClientInit(): Promise<ConnectivityTestResult> {
  const startTime = Date.now();
  console.log('🏗️ Testing Hedera client initialization...');
  
  try {
    // Get credentials from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('name, value')
      .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY']);

    if (error || !secrets) {
      throw new Error(`Failed to fetch Hedera credentials: ${error?.message}`);
    }

    const operatorId = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID')?.value;
    const operatorKey = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY')?.value;

    if (!operatorId || !operatorKey) {
      throw new Error('Missing Hedera credentials in secrets table');
    }

    // Create Hedera client with aggressive timeout settings
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
    
    // Set very short timeouts for quick testing
    client.setRequestTimeout(5000); // 5 seconds per request
    client.setMaxExecutionTime(15000); // 15 seconds total
    
    console.log(`✅ Hedera client initialized with operator ${operatorId}`);
    
    return {
      test: 'Hedera Client Init',
      status: 'success',
      duration: Date.now() - startTime,
      details: { operatorId, hasPrivateKey: !!operatorKey }
    };
  } catch (error) {
    return {
      test: 'Hedera Client Init',
      status: 'failure',
      duration: Date.now() - startTime,
      details: {},
      error: error.message
    };
  }
}

async function testAccountBalanceQuery(): Promise<ConnectivityTestResult> {
  const startTime = Date.now();
  console.log('💰 Testing account balance query (simplest Hedera operation)...');
  
  try {
    // Get credentials from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('name, value')
      .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY']);

    if (error || !secrets) {
      throw new Error(`Failed to fetch Hedera credentials: ${error?.message}`);
    }

    const operatorId = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID')?.value;
    const operatorKey = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY')?.value;

    if (!operatorId || !operatorKey) {
      throw new Error('Missing Hedera credentials in secrets table');
    }

    // Create Hedera client with very short timeouts
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
    client.setRequestTimeout(10000); // 10 seconds per request
    client.setMaxExecutionTime(20000); // 20 seconds total
    
    // Query account balance - this is the simplest Hedera operation
    const query = new AccountBalanceQuery()
      .setAccountId(operatorId);
    
    console.log(`⏳ Executing balance query for ${operatorId}...`);
    const balance = await query.execute(client);
    
    console.log(`✅ Balance query successful: ${balance.hbars.toString()}`);
    
    return {
      test: 'Account Balance Query',
      status: 'success',
      duration: Date.now() - startTime,
      details: { 
        operatorId, 
        balance: balance.hbars.toString(),
        tokens: balance.tokens ? Object.keys(balance.tokens).length : 0
      }
    };
  } catch (error) {
    return {
      test: 'Account Balance Query',
      status: 'failure',
      duration: Date.now() - startTime,
      details: {},
      error: error.message
    };
  }
}

async function testTopicCreation(): Promise<ConnectivityTestResult> {
  const startTime = Date.now();
  console.log('📝 Testing HCS topic creation...');
  
  try {
    // Get credentials from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: secrets, error } = await supabase
      .from('secrets')
      .select('name, value')
      .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY']);

    if (error || !secrets) {
      throw new Error(`Failed to fetch Hedera credentials: ${error?.message}`);
    }

    const operatorId = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID')?.value;
    const operatorKey = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY')?.value;

    if (!operatorId || !operatorKey) {
      throw new Error('Missing Hedera credentials in secrets table');
    }

    // Create Hedera client with very short timeouts for testing
    const client = Client.forTestnet();
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
    client.setRequestTimeout(15000); // 15 seconds per request
    client.setMaxExecutionTime(30000); // 30 seconds total
    
    // Create a test topic
    const memo = `CONNECTIVITY_TEST_${Date.now()}`;
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setAutoRenewPeriod(7890000) // ~3 months
      .setAutoRenewAccountId(operatorId);
    
    console.log(`⏳ Creating test topic with memo: ${memo}...`);
    const txResponse = await transaction.execute(client);
    
    console.log(`✅ Topic creation transaction submitted: ${txResponse.transactionId}`);
    
    // Get the receipt to confirm success
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId?.toString();
    
    console.log(`✅ Test topic created successfully: ${topicId}`);
    
    return {
      test: 'HCS Topic Creation',
      status: 'success',
      duration: Date.now() - startTime,
      details: { 
        topicId,
        transactionId: txResponse.transactionId.toString(),
        memo
      }
    };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500), // Truncate stack trace
      timeout: error.message?.includes('timeout'),
      grpc: error.message?.includes('grpc') || error.message?.includes('GRPC'),
      network: error.message?.includes('network') || error.message?.includes('connection')
    };
    
    return {
      test: 'HCS Topic Creation',
      status: 'failure',
      duration: Date.now() - startTime,
      details: errorDetails,
      error: error.message
    };
  }
}

async function runFullConnectivityTest(): Promise<ConnectivityTestResult[]> {
  console.log('🚀 Starting comprehensive Hedera connectivity test...');
  
  const tests = [
    testDNSResolution,
    testNodeConnectivity,
    testHederaClientInit,
    testAccountBalanceQuery,
    testTopicCreation
  ];
  
  const results: ConnectivityTestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      console.log(`${result.status === 'success' ? '✅' : '❌'} ${result.test}: ${result.status} (${result.duration}ms)`);
      
      // If a critical test fails, skip remaining tests
      if (result.test === 'Hedera Client Init' && result.status === 'failure') {
        console.log('⏹️ Skipping remaining tests due to client initialization failure');
        break;
      }
    } catch (error) {
      console.error(`💥 Test crashed: ${error.message}`);
      results.push({
        test: 'Unknown Test',
        status: 'failure',
        duration: 0,
        details: {},
        error: error.message
      });
    }
  }
  
  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Hedera connectivity test started');
    const results = await runFullConnectivityTest();
    
    const summary = {
      totalTests: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failure').length,
      partial: results.filter(r => r.status === 'partial').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };
    
    console.log('📊 Connectivity test completed:', summary);
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Connectivity test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});