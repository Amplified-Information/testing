import { 
  Client, 
  TopicCreateTransaction, 
  Hbar, 
  PrivateKey 
} from 'npm:@hashgraph/sdk@2.72.0'

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
    
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(options.memo)
      .setMaxTransactionFee(new Hbar(options.maxTransactionFee || 2))
    
    // Set admin key if provided (allows topic updates/deletion)
    if (options.adminKey) {
      transaction.setAdminKey(options.adminKey.publicKey)
    }
    
    // Set submit key if provided (restricts who can submit messages)
    if (options.submitKey) {
      transaction.setSubmitKey(options.submitKey.publicKey)
    }
    
    // Set auto-renew for long-lived topics
    if (options.autoRenewAccountId) {
      transaction.setAutoRenewAccountId(options.autoRenewAccountId)
      transaction.setAutoRenewPeriod(options.autoRenewPeriod || 7776000) // 90 days
    }

    const txResponse = await transaction.execute(client)
    const receipt = await txResponse.getReceipt(client)
    const topicId = receipt.topicId?.toString()

    if (!topicId) {
      throw new Error('Failed to create HCS topic - no topic ID returned')
    }

    console.log(`✅ Created new topic with ID: ${topicId}`)
    return topicId
  } catch (error) {
    console.error('Error creating topic:', error)
    throw new Error(`Topic creation failed: ${error.message}`)
  }
}

export async function createCLOBTopic(
  client: Client,
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes',
  marketId?: string,
  operatorPrivateKey?: PrivateKey
): Promise<string> {
  const memo = `CLOB-${topicType}${marketId ? `-${marketId}` : ''}`
  
  return createTopic(client, {
    memo,
    adminKey: operatorPrivateKey,
    submitKey: operatorPrivateKey,
    autoRenewAccountId: client.operatorAccountId?.toString(),
    autoRenewPeriod: 7776000, // 90 days
    maxTransactionFee: 2
  })
}