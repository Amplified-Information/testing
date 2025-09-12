import { Client, AccountId, PrivateKey, AccountBalanceQuery, TopicMessageSubmitTransaction, TopicId } from 'npm:@hashgraph/sdk@2.72.0'
import { networkHealth } from './networkHealth.ts'

export interface HederaClientConfig {
  operatorId: string
  operatorKey: string
  network?: 'testnet' | 'mainnet'
}

export function createHederaClient(config: HederaClientConfig): Client {
  if (!config.operatorId || !config.operatorKey) {
    throw new Error('Environment variables OPERATOR_ID and OPERATOR_KEY are required.')
  }

  const network = config.network || 'testnet'
  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet()
  
  // Circuit Breaker Pattern: Aggressive configuration for submission-only operations
  if (network === 'testnet') {
    console.log('🔧 Configuring circuit breaker pattern for testnet submission...')
    
    // Aggressive timeouts for submission-only (no receipt waiting)
    const requestTimeout = 8000        // 8s max per node attempt (reduced from 30s)
    const maxNodeAttempts = 7          // Try more nodes but faster
    const minBackoff = 500             // Faster backoff for quick node switching
    const maxBackoff = 2000            // Lower max backoff
    
    client.setRequestTimeout(requestTimeout)
    client.setMaxNodeAttempts(maxNodeAttempts)
    client.setMinBackoff(minBackoff)
    client.setMaxBackoff(maxBackoff)
    
    // More aggressive node management for circuit breaker
    if (typeof client.setMaxNodeReadmitTime === 'function') {
      client.setMaxNodeReadmitTime(60000) // 1 minute readmit (reduced from 5 min)
    }
    
    if (typeof client.setCloseTimeout === 'function') {
      client.setCloseTimeout(3000)   // 3s close timeout
    }
    
    // Network health check
    const networkStatus = networkHealth.getNetworkStatus()
    console.log(`🏥 Network health: ${networkStatus.healthy}/${networkStatus.total} nodes, avg: ${networkStatus.avgResponseTime}ms`)
    
    if (networkHealth.shouldSkipTransaction()) {
      console.warn('🚨 Circuit breaker OPEN - network too unhealthy for transactions')
    }
    
    console.log('✅ Circuit breaker configuration applied')
    console.log(`📊 Aggressive config: timeout=${requestTimeout}ms, maxAttempts=${maxNodeAttempts}`)
  }
  
  const operatorAccountId = AccountId.fromString(config.operatorId)
  const operatorPrivateKey = PrivateKey.fromStringECDSA(config.operatorKey)
  
  client.setOperator(operatorAccountId, operatorPrivateKey)
  
  return client
}

export function getSystemHederaClient(): Client {
  const systemAccountId = Deno.env.get('CLOB_SYSTEM_ACCOUNT_ID')
  const systemAccountPrivateKey = Deno.env.get('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY')
  
  if (!systemAccountId || !systemAccountPrivateKey) {
    throw new Error('System Hedera credentials not configured')
  }

  return createHederaClient({
    operatorId: systemAccountId,
    operatorKey: systemAccountPrivateKey,
    network: 'testnet'
  })
}

export async function getSystemHederaClientFromSecrets(supabase: any): Promise<{ client: Client, privateKey: PrivateKey }> {
  console.log('Reading Hedera credentials from secrets table...')
  
  const { data: secrets, error } = await supabase
    .from('secrets')
    .select('name, value')
    .in('name', ['CLOB_SYSTEM_ACCOUNT_ID', 'CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY'])
  
  if (error) {
    console.error('Failed to read secrets from database:', error)
    throw new Error(`Failed to read secrets: ${error.message}`)
  }
  
  if (!secrets || secrets.length !== 2) {
    console.error('Missing Hedera credentials in secrets table. Found:', secrets?.length || 0, 'secrets')
    throw new Error('Required Hedera credentials not found in secrets table')
  }
  
  const secretsMap = secrets.reduce((acc: Record<string, string>, secret) => {
    acc[secret.name] = secret.value
    return acc
  }, {})
  
  const systemAccountId = secretsMap['CLOB_SYSTEM_ACCOUNT_ID']
  let systemAccountPrivateKey = secretsMap['CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY']
  
  if (!systemAccountId || !systemAccountPrivateKey) {
    console.error('Missing required credentials:', {
      accountId: systemAccountId ? 'FOUND' : 'MISSING',
      privateKey: systemAccountPrivateKey ? 'FOUND' : 'MISSING'
    })
    throw new Error('Required Hedera credentials are empty in secrets table')
  }
  
  // Handle different private key formats and validate ECDSA key
  if (systemAccountPrivateKey.startsWith('0x')) {
    systemAccountPrivateKey = systemAccountPrivateKey.slice(2)
  }
  
  // Validate ECDSA key format (should be 64 hex characters)
  if (!/^[0-9a-fA-F]{64}$/.test(systemAccountPrivateKey)) {
    console.error('Invalid ECDSA private key format:', {
      length: systemAccountPrivateKey.length,
      isHex: /^[0-9a-fA-F]+$/.test(systemAccountPrivateKey),
      expected: '64 hex characters'
    })
    throw new Error('Invalid ECDSA private key format. Expected 64 hex characters.')
  }
  
  console.log('Successfully retrieved and validated Hedera credentials', {
    accountId: systemAccountId,
    keyLength: systemAccountPrivateKey.length,
    keyPrefix: systemAccountPrivateKey.substring(0, 4)
  })
  
  try {
    const client = createHederaClient({
      operatorId: systemAccountId,
      operatorKey: systemAccountPrivateKey,
      network: 'testnet'
    })
    
    // Create PrivateKey object for topic creation using ECDSA format
    const privateKey = PrivateKey.fromStringECDSA(systemAccountPrivateKey)
    
    return { client, privateKey }
  } catch (error) {
    console.error('Failed to create Hedera client:', error)
    console.error('Account ID format:', systemAccountId)
    console.error('Private key format (first 10 chars):', systemAccountPrivateKey.substring(0, 10))
    
    // Enhanced error categorization
    if (error.message?.includes('invalid private key') || error.message?.includes('invalid account')) {
      throw new Error(`Invalid Hedera credentials: ${error.message}`)
    } else if (error.message?.includes('network') || error.message?.includes('nodes')) {
      throw new Error(`Network connectivity issue: ${error.message}`)
    } else {
      throw new Error(`Hedera client initialization failed: ${error.message}`)
    }
  }
}

// Test topic ID for HCS connectivity tests (reusable across tests)
const HCS_TEST_TOPIC_ID = '0.0.4809394' // Pre-created test topic on testnet

// Quick connectivity test using account balance query
async function quickConnectivityTest(client: Client, operatorId: string) {
  const start = Date.now()

  const balance = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(operatorId))
    .execute(client)

  return {
    success: true,
    description: "Operator credentials valid, client connected",
    hbars: balance.hbars.toString(),
    timing: Date.now() - start,
  }
}

// HCS message submit test to verify consensus service connectivity
async function hcsMessageTest(client: Client, topicId: string) {
  const start = Date.now()

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(`Connection test at ${new Date().toISOString()}`)
    .setTransactionValidDuration(30) // 30 seconds for lighter message operation
    .execute(client)

  const receipt = await tx.getReceipt(client)

  return {
    success: receipt.status.toString() === "SUCCESS",
    description: "Message successfully submitted to HCS",
    status: receipt.status.toString(),
    timing: Date.now() - start,
  }
}

// Two-tier connection test combining both approaches
export async function twoTierConnectionTest(client: Client, operatorId: string, testTopicId: string = HCS_TEST_TOPIC_ID) {
  const results = []

  try {
    console.log('🔧 Client configuration summary (using default values):')
    console.log('   Request Timeout: 30000ms')
    console.log('   Min Backoff: 1000ms')
    console.log('   Max Backoff: 8000ms')
    console.log('   Max Node Attempts: 5')

    // Tier 1: Quick balance check
    console.log('🔍 Tier 1: Quick connectivity test...')
    results.push(await quickConnectivityTest(client, operatorId))

    // Tier 2: HCS message submit with enhanced timeout handling
    console.log('🔍 Tier 2: HCS message test with keepalive configuration...')
    results.push(await hcsMessageTest(client, testTopicId))

    const totalTime = results.map(r => r.timing).reduce((a,b) => a+b, 0)
    const allSuccess = results.every(r => r.success)

    return {
      phase: "Two-Tier Connection Test (Enhanced gRPC)",
      results,
      summary: allSuccess
        ? `✅ Connection + HCS verified with keepalive (${totalTime}ms)`
        : "❌ One or more connection tests failed",
      configuration: {
        requestTimeout: 30000,
        minBackoff: 1000,
        maxBackoff: 8000,
        maxNodeAttempts: 5
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Connection test error:', errorMessage)
    
    // Enhanced error analysis for gRPC issues
    let errorCategory = 'unknown'
    if (errorMessage.includes('TIMEOUT') || errorMessage.includes('Code 17')) {
      errorCategory = 'grpc_timeout'
    } else if (errorMessage.includes('UNAVAILABLE') || errorMessage.includes('Code 14')) {
      errorCategory = 'grpc_unavailable'
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorCategory = 'network_connectivity'
    }
    
    return {
      phase: "Two-Tier Connection Test (Enhanced gRPC)", 
      results: [{
        success: false,
        description: "Unexpected error during test",
        error: errorMessage,
        errorCategory,
      }],
      summary: `❌ Connection test failed: ${errorCategory}`,
    }
  }
}