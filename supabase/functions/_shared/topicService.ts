import { 
  Client, 
  TopicCreateTransaction, 
  Hbar, 
  PrivateKey 
} from 'https://esm.sh/@hashgraph/sdk@2.72.0'

// Configuration constants
const TOPIC_CREATION_TIMEOUT = 30000 // 30s timeout
const MAX_RETRIES = 2 // Retry attempts for testnet
const BASE_RETRY_DELAY = 1000 // 1s base delay

// Timing utility for SDK operations
const withTiming = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  const start = Date.now()
  try {
    const result = await operation()
    console.log(`${label} completed in ${Date.now() - start}ms`)
    return result
  } catch (error) {
    console.log(`${label} failed after ${Date.now() - start}ms:`, error)
    throw error
  }
}

// Retry with exponential backoff for testnet
const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES, 
  baseDelay: number = BASE_RETRY_DELAY
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

export interface TopicCreationOptions {
  memo: string
  adminKey?: PrivateKey
  submitKey?: PrivateKey
  autoRenewAccountId?: string
  autoRenewPeriod?: number
  maxTransactionFee?: number
}

export async function createTopic(
  client: Client, 
  options: TopicCreationOptions
): Promise<string> {
  try {
    console.log('Creating HCS topic with memo:', options.memo)
    console.log('Transaction details:', {
      memo: options.memo,
      hasAdminKey: !!options.adminKey,
      hasSubmitKey: !!options.submitKey,
      autoRenewAccountId: options.autoRenewAccountId,
      maxFee: options.maxTransactionFee || 2
    })
    
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(options.memo)
      .setMaxTransactionFee(new Hbar(options.maxTransactionFee || 2))
    
    // Set admin key if provided (allows topic updates/deletion)
    if (options.adminKey) {
      console.log('Setting admin key...')
      transaction.setAdminKey(options.adminKey.publicKey)
    }
    
    // Set submit key if provided (restricts who can submit messages)
    if (options.submitKey) {
      console.log('Setting submit key...')
      transaction.setSubmitKey(options.submitKey.publicKey)
    }
    
    // Set auto-renew for long-lived topics
    if (options.autoRenewAccountId) {
      console.log('Setting auto-renew...')
      transaction.setAutoRenewAccountId(options.autoRenewAccountId)
      transaction.setAutoRenewPeriod(options.autoRenewPeriod || 7776000) // 90 days
    }

    console.log('Executing transaction...')
    const executeStart = Date.now()
    const txResponse = await transaction.execute(client)
    console.log(`Transaction executed in ${Date.now() - executeStart}ms, getting receipt...`)
    
    const receiptStart = Date.now()
    const receipt = await txResponse.getReceipt(client)
    console.log(`Receipt received in ${Date.now() - receiptStart}ms`)
    
    const topicId = receipt.topicId?.toString()

    if (!topicId) {
      throw new Error('Failed to create HCS topic - no topic ID returned')
    }

    console.log(`✅ Created new topic with ID: ${topicId}`)
    return topicId
  } catch (error) {
    console.error('Error creating topic:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0]
    })
    throw new Error(`Topic creation failed: ${error.message}`)
  }
}

// Create a CLOB topic with proper abort handling, timing, and retry
export async function createCLOBTopic(
  client: Client,
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes',
  marketId?: string,
  operatorPrivateKey?: PrivateKey
): Promise<string> {
  console.log(`Creating ${topicType} topic${marketId ? ` for market ${marketId}` : ''}`)
  
  const memo = `CLOB-${topicType.toUpperCase()}${marketId ? `-${marketId}` : ''}`
  
  return await withRetry(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TOPIC_CREATION_TIMEOUT)
    
    try {
      const topicId = await withTiming(`${topicType} topic creation`, async () => {
        const transaction = new TopicCreateTransaction()
          .setTopicMemo(memo)
          .setMaxTransactionFee(new Hbar(2))
        
        // Set admin and submit keys if provided
        if (operatorPrivateKey) {
          transaction.setAdminKey(operatorPrivateKey.publicKey)
          transaction.setSubmitKey(operatorPrivateKey.publicKey)
        }
        
        // Set auto-renew for long-lived topics
        if (client.operatorAccountId) {
          transaction.setAutoRenewAccountId(client.operatorAccountId.toString())
          transaction.setAutoRenewPeriod(7776000) // 90 days
        }
        
        // Freeze and sign transaction if private key provided
        const finalTx = operatorPrivateKey ? 
          await transaction.freezeWith(client).sign(operatorPrivateKey) :
          transaction
        
        // Send transaction and track timing
        const txResponse = await withTiming('Transaction submit', async () => {
          return await finalTx.execute(client)
        })
        
        // Get receipt and track timing
        const receipt = await withTiming('Receipt retrieval', async () => {
          return await txResponse.getReceipt(client)
        })
        
        if (!receipt.topicId) {
          throw new Error('Topic creation failed - no topic ID in receipt')
        }
        
        return receipt.topicId.toString()
      })
      
      console.log(`Successfully created ${topicType} topic: ${topicId}`)
      return topicId
      
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(`${topicType} topic creation timeout after ${TOPIC_CREATION_TIMEOUT}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  })
}