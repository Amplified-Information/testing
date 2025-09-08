import { Client, AccountId, PrivateKey } from 'npm:@hashgraph/sdk@2.72.0'

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

export async function getSystemHederaClientFromSecrets(supabase: any): Promise<Client> {
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
  
  // Handle different private key formats
  if (systemAccountPrivateKey.startsWith('0x')) {
    systemAccountPrivateKey = systemAccountPrivateKey.slice(2)
  }
  
  console.log('Successfully retrieved Hedera credentials from secrets', {
    accountId: systemAccountId,
    keyLength: systemAccountPrivateKey.length,
    keyPrefix: systemAccountPrivateKey.substring(0, 4)
  })
  
  try {
    return createHederaClient({
      operatorId: systemAccountId,
      operatorKey: systemAccountPrivateKey,
      network: 'testnet'
    })
  } catch (error) {
    console.error('Failed to create Hedera client:', error)
    console.error('Account ID format:', systemAccountId)
    console.error('Private key format (first 10 chars):', systemAccountPrivateKey.substring(0, 10))
    throw error
  }
}