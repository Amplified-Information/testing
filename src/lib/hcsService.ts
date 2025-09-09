import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, PrivateKey, AccountId, AccountBalanceQuery } from '@hashgraph/sdk';
import { supabase } from '@/integrations/supabase/client';

export interface HCSTestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

export class HCSTestService {
  private client: Client | null = null;
  private operatorId: string | null = null;
  private operatorKey: string | null = null;

  async initialize(): Promise<HCSTestResult> {
    try {
      // Step 1: Fetch credentials from Supabase secrets
      const { data: secrets, error } = await supabase
        .from('secrets')
        .select('*')
        .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY']);

      if (error) {
        throw new Error(`Failed to fetch credentials: ${error.message}`);
      }

      if (!secrets || secrets.length < 2) {
        throw new Error('Missing Hedera credentials in secrets table');
      }

      const operatorIdSecret = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID');
      const operatorKeySecret = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY');

      if (!operatorIdSecret?.value || !operatorKeySecret?.value) {
        throw new Error('Hedera credentials not found or empty');
      }

      this.operatorId = operatorIdSecret.value;
      this.operatorKey = operatorKeySecret.value;

      // Step 2: Initialize Hedera client
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);

      return {
        step: 'Initialize Client',
        status: 'success',
        message: `Successfully initialized Hedera client with account ${this.operatorId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        step: 'Initialize Client',
        status: 'error',
        message: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async createTopic(memo: string = "HCS Test Topic"): Promise<HCSTestResult> {
    if (!this.client) {
      return {
        step: 'Create Topic',
        status: 'error',
        message: 'Client not initialized',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Step 3: Create the topic
      const topicTransaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setAutoRenewPeriod(3600); // 1 hour auto-renew

      const submitResponse = await topicTransaction.execute(this.client);
      const receipt = await submitResponse.getReceipt(this.client);
      const topicId = receipt.topicId;

      if (!topicId) {
        throw new Error('No topic ID returned from transaction');
      }

      return {
        step: 'Create Topic',
        status: 'success',
        message: `Successfully created topic: ${topicId.toString()}`,
        data: { topicId: topicId.toString() },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        step: 'Create Topic',
        status: 'error',
        message: `Failed to create topic: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async submitMessage(topicId: string, message: string): Promise<HCSTestResult> {
    if (!this.client) {
      return {
        step: 'Submit Message',
        status: 'error',
        message: 'Client not initialized',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Step 4: Submit message to topic
      const messageTransaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message);

      const submitResponse = await messageTransaction.execute(this.client);
      const receipt = await submitResponse.getReceipt(this.client);

      return {
        step: 'Submit Message',
        status: 'success',
        message: `Successfully submitted message to topic ${topicId}`,
        data: { 
          topicId,
          message,
          transactionId: submitResponse.transactionId?.toString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        step: 'Submit Message',
        status: 'error',
        message: `Failed to submit message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getAccountBalance(): Promise<HCSTestResult> {
    if (!this.client || !this.operatorId) {
      return {
        step: 'Check Balance',
        status: 'error',
        message: 'Client not initialized',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const accountId = AccountId.fromString(this.operatorId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);
      
      return {
        step: 'Check Balance',
        status: 'success',
        message: `Account balance: ${balance.hbars.toString()}`,
        data: { balance: balance.hbars.toString() },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        step: 'Check Balance',
        status: 'error',
        message: `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runCompleteTest(): Promise<HCSTestResult[]> {
    const results: HCSTestResult[] = [];
    
    // Step 1: Initialize
    const initResult = await this.initialize();
    results.push(initResult);
    
    if (initResult.status === 'error') {
      return results;
    }

    // Step 2: Check balance
    const balanceResult = await this.getAccountBalance();
    results.push(balanceResult);

    // Step 3: Create topic
    const createResult = await this.createTopic("Complete HCS Test - " + new Date().toISOString());
    results.push(createResult);

    if (createResult.status === 'error' || !createResult.data?.topicId) {
      return results;
    }

    // Step 4: Submit message
    const messageResult = await this.submitMessage(
      createResult.data.topicId,
      `Hello Hedera! Test message sent at ${new Date().toISOString()}`
    );
    results.push(messageResult);

    return results;
  }
}

export const hcsTestService = new HCSTestService();