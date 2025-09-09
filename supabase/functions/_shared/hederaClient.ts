import { Client, AccountId, PrivateKey, AccountBalanceQuery, TopicMessageSubmitTransaction, TopicId } from 'npm:@hashgraph/sdk@2.72.0'

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
  
  // Simple testnet timeout configuration (was working before)
  if (network === 'testnet') {
    client.setRequestTimeout(120000) // 2 minutes for testnet
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
    // Tier 1: Quick balance check
    console.log('🔍 Tier 1: Quick connectivity test...')
    results.push(await quickConnectivityTest(client, operatorId))

    // Tier 2: HCS message submit
    console.log('🔍 Tier 2: HCS message test...')
    results.push(await hcsMessageTest(client, testTopicId))

    const totalTime = results.map(r => r.timing).reduce((a,b) => a+b, 0)
    const allSuccess = results.every(r => r.success)

    return {
      phase: "Two-Tier Connection Test",
      results,
      summary: allSuccess
        ? `✅ Connection + HCS verified (${totalTime}ms)`
        : "❌ One or more connection tests failed",
    }
  } catch (error) {
    return {
      phase: "Two-Tier Connection Test", 
      results: [{
        success: false,
        description: "Unexpected error during test",
        error: error instanceof Error ? error.message : String(error),
      }],
      summary: "❌ Connection test failed with error",
    }
  }
}