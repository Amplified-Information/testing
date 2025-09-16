import {
  Client, 
  TopicCreateTransaction, 
  Hbar, 
  PrivateKey
} from 'npm:@hashgraph/sdk@2.72.0'
import { networkHealth } from './networkHealth.ts'

// Testnet-optimized configuration for enhanced reliability
const SUBMISSION_TIMEOUT = 20000 // 20s max for submission (increased from 10s)
const MAX_FAST_RETRIES = 8 // More retry attempts for testnet (increased from 4)
const FAST_RETRY_DELAY = 500 // 500ms base delay for progressive backoff

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

// Circuit Breaker with Network Health Awareness
const withCircuitBreakerRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_FAST_RETRIES,
  operationName: string = 'operation'
): Promise<T> => {
  let lastError: Error
  
  // Pre-flight network health check
  if (networkHealth.shouldSkipTransaction()) {
    throw new Error('Circuit breaker OPEN - network too unhealthy')
  }
  
  if (typeof operation !== 'function') {
    throw new Error(`withCircuitBreakerRetry expects operation to be a function, got ${typeof operation}`)
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now()
    
    try {
      console.log(`🔄 ${operationName} attempt ${attempt}/${maxRetries}`)
      const result = await operation()
      
      // Record success for network health
      const duration = Date.now() - attemptStart
      const nodeId = extractNodeIdFromContext() // Will implement node extraction
      if (nodeId) {
        networkHealth.recordSuccess(nodeId, duration)
      }
      
      console.log(`✅ ${operationName} succeeded on attempt ${attempt} (${duration}ms)`)
      return result
    } catch (error) {
      lastError = error as Error
      const duration = Date.now() - attemptStart
      
      // Record failure for network health
      const nodeId = extractNodeIdFromError(lastError) || 'unknown'
      networkHealth.recordFailure(nodeId, lastError.message)
      
      console.log(`❌ ${operationName} attempt ${attempt} failed in ${duration}ms: ${lastError.message}`)
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Enhanced retry logic for testnet reliability
      const isRetryableError = lastError.message?.includes('timeout') ||
                               lastError.message?.includes('TIMEOUT') ||
                               lastError.message?.includes('UNAVAILABLE') ||
                               lastError.message?.includes('DEADLINE_EXCEEDED') ||
                               lastError.message?.includes('grpc deadline exceeded') ||
                               lastError.message?.includes('Code: 17') ||
                               lastError.message?.includes('Code: 14') ||
                               lastError.message?.includes('Code: 4') // DEADLINE_EXCEEDED
      
      if (!isRetryableError) {
        console.log(`Non-retryable error, failing immediately: ${lastError.message}`)
        throw lastError
      }
      
      // Progressive exponential backoff with jitter for testnet
      const baseDelay = FAST_RETRY_DELAY * Math.pow(2, attempt - 1) // 500ms → 1s → 2s → 4s
      const jitter = Math.random() * 500 // Add up to 500ms jitter
      const delay = Math.min(baseDelay + jitter, 8000) // Cap at 8 seconds
      console.log(`⚡ Enhanced retry in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Extract node ID from error messages for health tracking
function extractNodeIdFromError(error: Error): string | null {
  const nodeMatch = error.message.match(/nodeAccountId.*?(\d+\.\d+\.\d+)/)
  return nodeMatch ? nodeMatch[1] : null
}

// Extract node ID from successful operations (placeholder for now)
function extractNodeIdFromContext(): string | null {
  // This would need SDK integration to track which node was used
  // For now, return null and rely on error-based tracking
  return null
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
    console.log('🚀 Creating HCS topic with circuit breaker:', options.memo)
    console.log('Transaction details:', {
      memo: options.memo,
      hasAdminKey: !!options.adminKey,
      hasSubmitKey: !!options.submitKey,
      autoRenewAccountId: options.autoRenewAccountId,
      maxFee: options.maxTransactionFee || 2
    })
    
    // Network health pre-check
    const networkStatus = networkHealth.getNetworkStatus()
    console.log(`🏥 Network health: ${networkStatus.healthy}/${networkStatus.total} nodes`)
    
    return await withTiming(
      'HCS topic creation',
      () => withCircuitBreakerRetry(async () => {
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

        // Testnet-optimized timeout settings
        transaction.setTransactionValidDuration(90) // 90 seconds (increased from 30)
        transaction.setGrpcDeadline(15000) // 15 seconds (increased from 6)

        console.log('Executing transaction with circuit breaker...')
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
      }, MAX_FAST_RETRIES, 'HCS topic creation')
    )
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
  
  console.log(`🚀 Creating ${topicType} topic with circuit breaker pattern`);
  
  // Pre-flight network health check
  const networkStatus = networkHealth.getNetworkStatus()
  console.log(`🏥 Network status: ${networkStatus.healthy}/${networkStatus.total} healthy nodes`)
  
  return await withTiming(
    `${topicType} topic submission`,
    () => withCircuitBreakerRetry(async () => {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo);

      // Testnet-optimized timeout settings for submission
      transaction.setTransactionValidDuration(90); // 90 seconds (increased from 30)
      transaction.setGrpcDeadline(15000); // 15 second gRPC timeout (increased from 6s)

      if (operatorPrivateKey) {
        console.log('Auto-renew settings applied successfully');
        const operatorAccountId = client.operatorAccountId;
        if (operatorAccountId) {
          console.log(`Setting auto-renew account ID: ${operatorAccountId}`);
          transaction.setAutoRenewAccountId(operatorAccountId);
          transaction.setAutoRenewPeriod(7776000); // 90 days in seconds
        }
      }

      // Submission with aggressive timeout - no receipt waiting
      console.log('Submitting transaction to Hedera network...');
      const submissionStart = Date.now()
      
      const response = await transaction.execute(client);
      const submissionTime = Date.now() - submissionStart
      
      // Return transaction ID immediately 
      const transactionId = response.transactionId?.toString();
      if (!transactionId) {
        throw new Error('Transaction submission failed: no transaction ID');
      }

      console.log(`⚡ Fast submission completed in ${submissionTime}ms: ${transactionId}`);
      return transactionId;
    }, MAX_FAST_RETRIES, `${topicType} topic submission`)
  );
}