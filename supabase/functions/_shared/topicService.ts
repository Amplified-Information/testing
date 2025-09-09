import { 
  Client, 
  TopicCreateTransaction, 
  Hbar, 
  PrivateKey 
} from 'https://esm.sh/@hashgraph/sdk@2.72.0'

// Configuration constants
const TOPIC_CREATION_TIMEOUT = 60000 // 60s timeout for slow testnet
const MAX_RETRIES = 3 // More retry attempts for testnet  
const BASE_RETRY_DELAY = 2000 // 2s base delay

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

// Retry with exponential backoff for testnet - enhanced for gRPC timeouts
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
      
      // Check if this is a gRPC timeout that we should retry
      const isRetryableError = lastError.message?.includes('GrpcServiceError') || 
                             lastError.message?.includes('TIMEOUT') ||
                             lastError.message?.includes('UNAVAILABLE') ||
                             lastError.message?.includes('DEADLINE_EXCEEDED')
      
      if (!isRetryableError) {
        console.log(`Non-retryable error on attempt ${attempt + 1}, failing immediately:`, error)
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`gRPC timeout on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${delay}ms:`, error.message)
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
          .setTransactionValidDuration(60) // 60 seconds gRPC deadline for slow testnet
        
        // Set admin and submit keys if provided
        if (operatorPrivateKey) {
          transaction.setAdminKey(operatorPrivateKey.publicKey)
          transaction.setSubmitKey(operatorPrivateKey.publicKey)
        }
        
        // Set auto-renew for long-lived topics
        if (client.operatorAccountId) {
          console.log('Setting auto-renew account ID:', client.operatorAccountId)
          try {
            transaction.setAutoRenewAccountId(client.operatorAccountId)
            transaction.setAutoRenewPeriod(7776000) // 90 days
            console.log('Auto-renew settings applied successfully')
          } catch (autoRenewError) {
            console.warn('Failed to set auto-renew settings:', autoRenewError)
            // Continue without auto-renew if it fails
          }
        }
        
        // Freeze and sign transaction if private key provided
        const finalTx = operatorPrivateKey ? 
          await transaction.freezeWith(client).sign(operatorPrivateKey) :
          transaction
        
        // Send transaction and track timing
        const txResponse = await withTiming('Transaction submit', async () => {
          console.log('Submitting transaction to Hedera network...')
          const response = await finalTx.execute(client)
          console.log('Transaction submitted successfully, response received')
          return response
        })
        
        // Get receipt and track timing
        const receipt = await withTiming('Receipt retrieval', async () => {
          console.log('Retrieving transaction receipt...')
          const r = await txResponse.getReceipt(client)
          console.log('Receipt retrieved successfully')
          return r
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