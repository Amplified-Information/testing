import { supabase } from '@/integrations/supabase/client';
import { hcsService } from '@/lib/hcs';

interface DirectTestResult {
  success: boolean;
  topicId?: string;
  topicType?: string;
  marketName?: string;
  error?: string;
  timing?: { duration: number };
}

interface TestCredentials {
  operatorId: string;
  operatorKey: string;
}

export class DirectHCSTest {
  private async fetchCredentials(): Promise<TestCredentials> {
    try {
      // Call the hcs-manager edge function to get credentials securely
      const { data, error } = await supabase.functions.invoke('hcs-manager', {
        body: { action: 'get-credentials' }
      });
      
      if (error) {
        throw new Error(`Failed to fetch credentials via edge function: ${error.message}`);
      }
      
      if (!data || !data.operatorId || !data.operatorKey) {
        throw new Error('Missing required Hedera credentials from edge function');
      }
      
      return {
        operatorId: data.operatorId,
        operatorKey: data.operatorKey
      };
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      throw new Error(`Credential fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTestMarket() {
    // Get a test market from the database
    const { data: markets, error } = await supabase
      .from('event_markets')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error || !markets) {
      // Use a fallback test market
      return {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Market: Will HCS topics work properly?'
      };
    }
    
    return markets;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>, 
    maxAttempts = 3,
    description = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempting ${description} (attempt ${attempt}/${maxAttempts})`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for ${description}:`, error);
        
        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${description} failed after ${maxAttempts} attempts: ${lastError?.message}`);
  }

  private async storeTopicInDatabase(
    topicId: string, 
    topicType: string, 
    marketId: string,
    marketName: string
  ): Promise<void> {
    const { error } = await supabase
      .from('hcs_topics')
      .insert({
        topic_id: topicId,
        topic_type: topicType,
        market_id: marketId,
        description: `${topicType} topic for market: ${marketName}`,
        is_active: true
      });
    
    if (error) {
      throw new Error(`Failed to store topic in database: ${error.message}`);
    }
  }

  async createMarketTopics(): Promise<DirectTestResult[]> {
    const results: DirectTestResult[] = [];
    
    try {
      // Step 1: Get credentials
      console.log('🔑 Fetching Hedera credentials from Supabase secrets...');
      const credentials = await this.fetchCredentials();
      
      // Step 2: Get test market
      console.log('📊 Selecting test market...');
      const market = await this.getTestMarket();
      
      // Step 3: Create topics for each type
      const topicTypes = ['orders', 'batches', 'oracle', 'disputes'] as const;
      
      for (const topicType of topicTypes) {
        try {
          console.log(`🚀 Creating ${topicType} topic for market: ${market.name}`);
          
          const startTime = Date.now();
          
          // Create topic with retry logic
          const topicId = await this.retryOperation(
            () => hcsService.createTopic(
              credentials.operatorId,
              credentials.operatorKey,
              topicType,
              market.id,
              `${topicType} topic for ${market.name}`
            ),
            3,
            `${topicType} topic creation`
          );
          
          const duration = Date.now() - startTime;
          
          // Store in database
          await this.storeTopicInDatabase(topicId, topicType, market.id, market.name);
          
          console.log(`✅ Successfully created ${topicType} topic: ${topicId}`);
          
          results.push({
            success: true,
            topicId,
            topicType,
            marketName: market.name,
            timing: { duration }
          });
          
        } catch (error) {
          console.error(`❌ Failed to create ${topicType} topic:`, error);
          
          results.push({
            success: false,
            topicType,
            marketName: market.name,
            error: `${topicType} topic creation failed: ${(error as Error).message}`
          });
        }
      }
      
      // Step 4: Test message submission on successful topics
      const successfulTopics = results.filter(r => r.success);
      if (successfulTopics.length > 0) {
        console.log('📝 Testing message submission on created topics...');
        
        for (const result of successfulTopics) {
          if (result.topicId) {
            try {
              const testMessage = JSON.stringify({
                type: 'test',
                timestamp: Date.now(),
                message: `Test message for ${result.topicType} topic`
              });
              
              await this.retryOperation(
                () => hcsService.submitMessage(
                  result.topicId!,
                  testMessage,
                  credentials.operatorId,
                  credentials.operatorKey
                ),
                2,
                `test message to ${result.topicType} topic`
              );
              
              console.log(`✅ Successfully sent test message to ${result.topicType} topic`);
            } catch (error) {
              console.warn(`⚠️ Failed to send test message to ${result.topicType} topic:`, error);
              // Don't fail the whole test for message submission issues
            }
          }
        }
      }
      
    } catch (error) {
      console.error('💥 Direct HCS test failed:', error);
      results.push({
        success: false,
        error: `Test setup failed: ${(error as Error).message}`
      });
    }
    
    return results;
  }

  async testSingleTopicCreation(topicType: 'orders' | 'batches' | 'oracle' | 'disputes'): Promise<DirectTestResult> {
    try {
      console.log(`🧪 Testing single ${topicType} topic creation...`);
      
      const credentials = await this.fetchCredentials();
      const startTime = Date.now();
      
      const topicId = await this.retryOperation(
        () => hcsService.createTopic(
          credentials.operatorId,
          credentials.operatorKey,
          topicType,
          undefined,
          `Single test ${topicType} topic`
        ),
        3,
        `single ${topicType} topic creation`
      );
      
      const duration = Date.now() - startTime;
      
      // Store in database
      await this.storeTopicInDatabase(topicId, topicType, 'test-single', `Single test ${topicType} topic`);
      
      console.log(`✅ Successfully created single ${topicType} topic: ${topicId}`);
      
      return {
        success: true,
        topicId,
        topicType,
        timing: { duration }
      };
      
    } catch (error) {
      console.error(`❌ Single ${topicType} topic creation failed:`, error);
      
      return {
        success: false,
        topicType,
        error: `Single ${topicType} topic creation failed: ${(error as Error).message}`
      };
    }
  }
}

export const directHcsTest = new DirectHCSTest();