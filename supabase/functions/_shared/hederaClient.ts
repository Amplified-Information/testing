import { Client, AccountId, PrivateKey, AccountBalanceQuery } from 'npm:@hashgraph/sdk@2.72.0'

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
  
  const operatorAccountId = AccountId.fromString(config.operatorId)
  const operatorPrivateKey = PrivateKey.fromString(config.operatorKey)
  
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
    
    // Create PrivateKey object for topic creation
    const privateKey = PrivateKey.fromString(systemAccountPrivateKey)
    
    // Test connection by checking account balance
    console.log('Testing Hedera client connectivity...')
    try {
      const accountId = AccountId.fromString(systemAccountId)
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(accountId)
      const balance = await balanceQuery.execute(client)
      console.log('✅ Hedera client connectivity verified. Account balance:', balance.hbars.toString())
    } catch (balanceError) {
      console.warn('⚠️ Account balance check failed (client may still work):', balanceError.message)
    }
    
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