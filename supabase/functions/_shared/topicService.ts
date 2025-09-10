import {
  Client, 
  TopicCreateTransaction, 
  Hbar, 
  PrivateKey
} from 'npm:@hashgraph/sdk@2.72.0'

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

// Enhanced retry with exponential backoff for testnet - improved for gRPC timeouts
const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES,
  shouldRetry?: (attempt: number, error: Error) => boolean
): Promise<T> => {
  let lastError: Error
  
  // Defensive check
  if (typeof operation !== 'function') {
    throw new Error(`withRetry expects operation to be a function, got ${typeof operation}`)
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Retry attempt ${attempt}/${maxRetries} - calling operation function`)
      const result = await operation()
      console.log(`Operation succeeded on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Use custom retry logic if provided, otherwise default behavior
      if (shouldRetry && !shouldRetry(attempt, lastError)) {
        throw lastError
      } else if (!shouldRetry) {
        // Default retry logic for gRPC timeouts
        const isRetryableError = lastError.message?.includes('GrpcServiceError') || 
                               lastError.message?.includes('TIMEOUT') ||
                               lastError.message?.includes('UNAVAILABLE') ||
                               lastError.message?.includes('DEADLINE_EXCEEDED')
        
        if (!isRetryableError) {
          console.log(`Non-retryable error on attempt ${attempt}, failing immediately:`, error)
          throw lastError
        }
      }
      
      const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1)
      console.log(`gRPC timeout on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms: ${lastError.message}`)
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

export async function createCLOBTopic(
  client: Client,
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes',
  marketId?: string,
  operatorPrivateKey?: PrivateKey
): Promise<string> {
  const memo = marketId 
    ? `${topicType.toUpperCase()}_${marketId}` 
    : topicType.toUpperCase();
  
  console.log(`Creating ${topicType} topic`);
  
  return await withTiming(
    `${topicType} topic creation`,
    () => withRetry(async () => {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo);

      // Optimized transaction settings for quick submission
      transaction.setTransactionValidDuration(60); // 1 minute
      transaction.setGrpcDeadline(25000); // 25 second gRPC timeout

      if (operatorPrivateKey) {
        console.log('Auto-renew settings applied successfully');
        const operatorAccountId = client.operatorAccountId;
        if (operatorAccountId) {
          console.log(`Setting auto-renew account ID: ${operatorAccountId}`);
          transaction.setAutoRenewAccountId(operatorAccountId);
          transaction.setAutoRenewPeriod(7776000); // 90 days in seconds (90 * 24 * 60 * 60)
        }
      }

      // Submit to Hedera network - SUBMIT ONLY, don't wait for receipt
      console.log('Submitting transaction to Hedera network...');
      const response = await transaction.execute(client);
      
      // Return the transaction ID immediately - no receipt waiting
      const transactionId = response.transactionId?.toString();
      if (!transactionId) {
        throw new Error('Transaction submission failed: no transaction ID');
      }

      console.log(`✅ Transaction submitted successfully: ${transactionId}`);
      return transactionId;
    }, 4, (attempt, error) => {
      if (error.message.includes('TIMEOUT') || error.message.includes('Code: 17')) {
        console.log(`gRPC timeout on attempt ${attempt}/4, retrying in ${Math.pow(2, attempt) * 1000}ms: ${error.message}`);
        return true;
      }
      return false;
    })
  );
}