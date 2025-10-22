import { 
  Client, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  PrivateKey,
  Hbar
} from '@hashgraph/sdk';
import { apiClient } from '@/utils/apiClient';
import { HCSMessage, HCSTopic } from '@/types/clob';
// Removed useDebugger import since it can't be used in classes

export interface HederaClientConfig {
  operatorId: string
  operatorKey: string
  network?: 'testnet' | 'mainnet'
}

export class HCSService {
  private client: Client;

  constructor(config?: HederaClientConfig) {
    const network = config?.network || 'testnet'
    this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet()
    
    if (config?.operatorId && config?.operatorKey) {
      this.setOperator(config.operatorId, config.operatorKey)
    }
  }
  
  /**
   * Set the operator for the client
   */
  setOperator(operatorId: string, operatorKey: string): void {
    const operatorAccountId = AccountId.fromString(operatorId)
    const operatorPrivateKey = PrivateKey.fromString(operatorKey)
    this.client.setOperator(operatorAccountId, operatorPrivateKey)
  }

  /**
   * Create a new HCS topic for a specific purpose (orders, batches, oracle, disputes)
   */
  async createTopic(
    operatorId: string,
    operatorKey: string,
    topicType: 'orders' | 'batches' | 'oracle' | 'disputes',
    marketId?: string,
    description?: string
  ): Promise<string> {
    try {
      console.log('[HCS] Creating HCS topic', { topicType, marketId });
      
      this.setOperator(operatorId, operatorKey);
      const operatorPrivateKey = PrivateKey.fromString(operatorKey);

      const memo = `CLOB-${topicType}${marketId ? `-${marketId}` : ''}`;
      
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setAdminKey(operatorPrivateKey.publicKey)
        .setSubmitKey(operatorPrivateKey.publicKey)
        .setAutoRenewAccountId(this.client.operatorAccountId!)
        .setAutoRenewPeriod(7776000) // 90 days
        .setMaxTransactionFee(new Hbar(2)); // safety cap

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId?.toString();

      if (!topicId) {
        throw new Error('Failed to create HCS topic - no topic ID returned');
      }

      console.log('[HCS] ✅ HCS topic created successfully', { topicId, memo });
      return topicId;
    } catch (error) {
      console.error('[HCS] Failed to create HCS topic', error);
      throw new Error(`Topic creation failed: ${error.message}`);
    }
  }

  /**
   * Submit a message to an HCS topic
   */
  async submitMessage(
    topicId: string,
    message: string,
    operatorId: string,
    operatorKey: string
  ): Promise<string> {
    try {
      console.log('[HCS] Submitting message to HCS topic', { topicId, messageLength: message.length });
      
      this.setOperator(operatorId, operatorKey);

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(topicId))
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(1)); // safety cap for message submission

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const sequenceNumber = receipt.topicSequenceNumber?.toString();

      if (!sequenceNumber) {
        throw new Error('Failed to get sequence number for HCS message');
      }

      console.log('[HCS] ✅ Message submitted successfully', { sequenceNumber });
      return sequenceNumber;
    } catch (error) {
      console.error('[HCS] Failed to submit HCS message', error);
      throw new Error(`Message submission failed: ${error.message}`);
    }
  }

  /**
   * Submit a large message by splitting it into chunks if necessary
   */
  async submitLargeMessage(
    topicId: string,
    message: string,
    operatorId: string,
    operatorKey: string,
    maxChunkSize = 1024
  ): Promise<string[]> {
    try {
      if (message.length <= maxChunkSize) {
        const sequenceNumber = await this.submitMessage(topicId, message, operatorId, operatorKey);
        return [sequenceNumber];
      }

      const chunks: string[] = [];
      const messageId = Date.now().toString();
      const totalChunks = Math.ceil(message.length / maxChunkSize);

      console.log('[HCS] Splitting large message into chunks', { totalChunks, messageLength: message.length });

      for (let i = 0; i < totalChunks; i++) {
        const start = i * maxChunkSize;
        const end = Math.min(start + maxChunkSize, message.length);
        const chunk = message.slice(start, end);
        
        const chunkMessage = JSON.stringify({
          messageId,
          chunkIndex: i,
          totalChunks,
          chunk
        });

        const sequenceNumber = await this.submitMessage(topicId, chunkMessage, operatorId, operatorKey);
        chunks.push(sequenceNumber);
      }

      return chunks;
    } catch (error) {
      console.error('[HCS] Failed to submit large HCS message', error);
      throw error;
    }
  }

  /**
   * Get messages from an HCS topic using mirror node API
   */
  async getTopicMessages(
    topicId: string,
    startSequence?: number,
    limit = 100
  ): Promise<HCSMessage[]> {
    try {
      console.log('[HCS] Fetching HCS topic messages', { topicId, startSequence, limit });
      
      const mirrorNodeUrl = import.meta.env.VITE_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1';
      let url = `${mirrorNodeUrl}/topics/${topicId}/messages?limit=${limit}&order=asc`;
      
      if (startSequence) {
        url += `&sequencenumber=gte:${startSequence}`;
      }

      const response = await apiClient.fetchWithRetry<{ messages: any[] }>(url);
      
      const messages: HCSMessage[] = response.messages.map((msg: any) => ({
        topicId: msg.topic_id,
        sequenceNumber: parseInt(msg.sequence_number),
        runningHash: msg.running_hash,
        consensusTimestamp: msg.consensus_timestamp,
        message: atob(msg.message), // decode base64
      }));

      console.log('[HCS] Retrieved HCS messages', { count: messages.length });
      return messages;
    } catch (error) {
      console.error('[HCS] Failed to fetch HCS messages', error);
      throw error;
    }
  }

  /**
   * Get the latest message from an HCS topic
   */
  async getLatestMessage(topicId: string): Promise<HCSMessage | null> {
    try {
      const messages = await this.getTopicMessages(topicId, undefined, 1);
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      console.error('[HCS] Failed to fetch latest HCS message', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time messages from an HCS topic (polling-based)
   */
  async subscribeToTopic(
    topicId: string,
    onMessage: (message: HCSMessage) => void,
    pollInterval = 1000,
    startSequence?: number
  ): Promise<() => void> {
    let isRunning = true;
    let lastSequence = startSequence || 0;

    const poll = async () => {
      if (!isRunning) return;

      try {
        const messages = await this.getTopicMessages(topicId, lastSequence + 1, 10);
        
        for (const message of messages) {
          if (message.sequenceNumber > lastSequence) {
            lastSequence = message.sequenceNumber;
            onMessage(message);
          }
        }
      } catch (error) {
        console.error('[HCS] Error polling HCS topic', error);
      }

      if (isRunning) {
        setTimeout(poll, pollInterval);
      }
    };

    // Start polling
    poll();

    // Return unsubscribe function
    return () => {
      isRunning = false;
    };
  }

  /**
   * Reconstruct chunked messages
   */
  reconstructChunkedMessage(chunks: HCSMessage[]): string | null {
    try {
      const chunkData = chunks.map(chunk => {
        try {
          return JSON.parse(chunk.message);
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (chunkData.length === 0) return null;

      const messageId = chunkData[0].messageId;
      const totalChunks = chunkData[0].totalChunks;
      
      // Sort chunks by index
      chunkData.sort((a, b) => a.chunkIndex - b.chunkIndex);
      
      // Verify we have all chunks
      if (chunkData.length !== totalChunks) {
        console.warn('[HCS] Missing chunks for message', { messageId, expected: totalChunks, received: chunkData.length });
        return null;
      }

      // Reconstruct message
      return chunkData.map(chunk => chunk.chunk).join('');
    } catch (error) {
      console.error('[HCS] Failed to reconstruct chunked message', error);
      return null;
    }
  }

  /**
   * Get topic info from mirror node
   */
  async getTopicInfo(topicId: string): Promise<any> {
    try {
      const mirrorNodeUrl = import.meta.env.VITE_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1';
      const url = `${mirrorNodeUrl}/topics/${topicId}`;
      return await apiClient.fetchWithRetry(url);
    } catch (error) {
      console.error('[HCS] Failed to fetch topic info', error);
      throw error;
    }
  }
}

export const hcsService = new HCSService();