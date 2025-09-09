import { supabase } from '@/integrations/supabase/client';

interface HCSTopicCreationResult {
  success: boolean;
  topicId?: string;
  requestId?: string;
  error?: string;
}

interface JobStatusResult {
  success: boolean;
  status: 'pending' | 'processing' | 'success' | 'failed';
  topic_id?: string;
  error?: string;
  duration?: number;
}

interface MarketTopicSetupResult {
  success: boolean;
  ordersTopicId?: string;
  batchesTopicId?: string;
  error?: string;
}

interface TestResults {
  phase: string;
  results: any[];
  summary: string;
}

export class HCSTopicTester {
  private static instance: HCSTopicTester;
  private testResults: TestResults[] = [];

  static getInstance(): HCSTopicTester {
    if (!HCSTopicTester.instance) {
      HCSTopicTester.instance = new HCSTopicTester();
    }
    return HCSTopicTester.instance;
  }

  /**
   * Poll job status until completion with timeout and retry logic
   */
  private async pollJobStatus(requestId: string, maxAttempts: number = 30, intervalMs: number = 2000): Promise<JobStatusResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.functions.invoke('hcs-manager', {
          body: {
            action: 'topic_status',
            requestId
          }
        });

        if (error) {
          return { success: false, status: 'failed', error: error.message };
        }

        const status = data.status;
        
        if (status === 'success') {
          return {
            success: true,
            status: 'success',
            topic_id: data.topic_id,
            duration: data.duration
          };
        }
        
        if (status === 'failed') {
          return {
            success: false,
            status: 'failed',
            error: data.error || 'Job failed without specific error'
          };
        }

        // Still pending or processing, wait and retry
        if (status === 'pending' || status === 'processing') {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            continue;
          }
        }
        
      } catch (err) {
        return { success: false, status: 'failed', error: (err as Error).message };
      }
    }
    
    return { 
      success: false, 
      status: 'failed', 
      error: `Timeout after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)` 
    };
  }

  /**
   * Create a single topic and wait for completion
   */
  private async createTopicAndWait(topicType: string, marketId?: string, description?: string): Promise<HCSTopicCreationResult> {
    try {
      // Submit topic creation job
      const { data, error } = await supabase.functions.invoke('hcs-manager', {
        body: {
          action: 'create_topic',
          topicType,
          marketId,
          description
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      console.log('HCS Manager Response:', data);

      if (!data || !data.requestId) {
        return { success: false, error: `No requestId returned from topic creation. Response: ${JSON.stringify(data)}` };
      }

      // Poll for completion
      const result = await this.pollJobStatus(data.requestId);
      
      if (result.success && result.topic_id) {
        return {
          success: true,
          topicId: result.topic_id,
          requestId: data.requestId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Topic creation failed',
          requestId: data.requestId
        };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Phase 1.1: Create Individual Test Topics
   */
  async createIndividualTestTopics(): Promise<TestResults> {
    console.log('Starting Phase 1.1: Creating individual test topics...');
    
    const testTopics = [
      {
        topicType: 'orders',
        description: 'Test orders topic for HCS validation'
      },
      {
        topicType: 'batches',
        description: 'Test batches topic for throughput testing'
      },
      {
        topicType: 'oracle',
        description: 'Test oracle topic for dispute resolution testing'
      }
    ];

    const results = [];

    for (const topic of testTopics) {
      console.log(`Creating ${topic.topicType} topic...`);
      const result = await this.createTopicAndWait(topic.topicType, undefined, topic.description);
      
      results.push({
        topicType: topic.topicType,
        success: result.success,
        topicId: result.topicId,
        requestId: result.requestId,
        error: result.error,
        description: topic.description
      });
    }

    const phase1Results: TestResults = {
      phase: 'Phase 1.1 - Individual Test Topics',
      results,
      summary: `Created ${results.filter(r => r.success).length}/3 individual test topics successfully`
    };

    this.testResults.push(phase1Results);
    return phase1Results;
  }

  /**
   * Phase 1.2: Create Market-Specific Topics
   */
  async createMarketSpecificTopics(): Promise<TestResults> {
    console.log('Starting Phase 1.2: Creating market-specific topics...');

    const testMarkets = [
      {
        id: '95e80e46-1c11-491a-8355-7dd07563baac',
        name: 'Which team will win the 2026 NBA Championship?',
        category: 'Sports'
      },
      {
        id: 'e1b56510-ef0c-44cd-9c6f-2ee318e4c4f2',
        name: 'Which tech company will have the highest market cap in 2027?',
        category: 'Technology'
      },
      {
        id: '2cb1d991-1b2c-4f6b-8ce4-0bccef9b1a28',
        name: 'Who will be the Republican nominee for President in 2028?',
        category: 'Politics'
      }
    ];

    const results = [];

    for (const market of testMarkets) {
      console.log(`Creating topics for market: ${market.name}`);
      
      // Create orders topic
      const ordersResult = await this.createTopicAndWait('orders', market.id, `Orders topic for ${market.name}`);
      
      // Create batches topic
      const batchesResult = await this.createTopicAndWait('batches', market.id, `Batches topic for ${market.name}`);
      
      results.push({
        marketId: market.id,
        marketName: market.name,
        category: market.category,
        success: ordersResult.success && batchesResult.success,
        ordersTopicId: ordersResult.topicId,
        batchesTopicId: batchesResult.topicId,
        ordersRequestId: ordersResult.requestId,
        batchesRequestId: batchesResult.requestId,
        error: ordersResult.error || batchesResult.error
      });
    }

    const phase2Results: TestResults = {
      phase: 'Phase 1.2 - Market-Specific Topics',
      results,
      summary: `Created topics for ${results.filter(r => r.success).length}/3 test markets successfully`
    };

    this.testResults.push(phase2Results);
    return phase2Results;
  }

  /**
   * Phase 1.3: Validate Topic Creation
   */
  async validateTopicCreation(): Promise<TestResults> {
    console.log('Starting Phase 1.3: Validating topic creation...');

    try {
      // Query the hcs_topics table directly
      const { data, error } = await supabase
        .from('hcs_topics')
        .select('*')
        .eq('is_active', true);

      if (error) {
        const validationResults: TestResults = {
          phase: 'Phase 1.3 - Topic Validation',
          results: [{ success: false, error: error.message }],
          summary: 'Failed to fetch topics for validation'
        };
        this.testResults.push(validationResults);
        return validationResults;
      }

      const topicStats = {
        total: data.length,
        byType: data.reduce((acc: any, topic: any) => {
          acc[topic.topic_type] = (acc[topic.topic_type] || 0) + 1;
          return acc;
        }, {}),
        byMarket: data.filter((t: any) => t.market_id).length,
        active: data.filter((t: any) => t.is_active).length,
        recentlyCreated: data.filter((t: any) => {
          const createdAt = new Date(t.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return createdAt > fiveMinutesAgo;
        }).length
      };

      // Also check recent job completions
      const { data: jobData } = await supabase
        .from('topic_creation_jobs')
        .select('*')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(10);

      const validationResults: TestResults = {
        phase: 'Phase 1.3 - Topic Validation',
        results: [
          {
            success: true,
            topicStats,
            recentJobs: jobData?.length || 0,
            validation: 'Topics successfully created and stored in database'
          }
        ],
        summary: `Validated ${topicStats.total} total topics: ${topicStats.active} active, ${topicStats.byMarket} market-specific, ${topicStats.recentlyCreated} created recently`
      };

      this.testResults.push(validationResults);
      return validationResults;
    } catch (err) {
      const validationResults: TestResults = {
        phase: 'Phase 1.3 - Topic Validation',
        results: [{ success: false, error: (err as Error).message }],
        summary: 'Topic validation failed'
      };
      this.testResults.push(validationResults);
      return validationResults;
    }
  }

  /**
   * Initialize All Markets (Phase 2.1)
   */
  async initializeAllmarkets(): Promise<TestResults> {
    console.log('Starting Phase 2.1: Initializing all market topics...');

    try {
      // Get all active markets that don't have topics yet
      const { data: markets, error: marketsError } = await supabase
        .from('event_markets')
        .select('id, name')
        .eq('is_active', true);

      if (marketsError) {
        throw new Error(`Failed to fetch markets: ${marketsError.message}`);
      }

      console.log(`Found ${markets.length} active markets to initialize`);
      
      const results = [];
      let successCount = 0;
      let topicsCreated = 0;

      // Process markets in batches to avoid overwhelming the system
      const batchSize = 3;
      for (let i = 0; i < markets.length; i += batchSize) {
        const batch = markets.slice(i, i + batchSize);
        
        for (const market of batch) {
          console.log(`Initializing topics for market: ${market.name}`);
          
          try {
            // Check if topics already exist
            const { data: existingTopics } = await supabase
              .from('hcs_topics')
              .select('topic_type')
              .eq('market_id', market.id);

            const hasOrders = existingTopics?.some(t => t.topic_type === 'orders');
            const hasBatches = existingTopics?.some(t => t.topic_type === 'batches');

            let ordersResult = null;
            let batchesResult = null;

            if (!hasOrders) {
              ordersResult = await this.createTopicAndWait('orders', market.id, `Orders topic for ${market.name}`);
              if (ordersResult.success) topicsCreated++;
            }

            if (!hasBatches) {
              batchesResult = await this.createTopicAndWait('batches', market.id, `Batches topic for ${market.name}`);
              if (batchesResult.success) topicsCreated++;
            }

            const marketSuccess = (!hasOrders ? ordersResult?.success : true) && (!hasBatches ? batchesResult?.success : true);
            if (marketSuccess) successCount++;

            results.push({
              marketId: market.id,
              marketName: market.name,
              success: marketSuccess,
              ordersTopicId: ordersResult?.topicId || 'Already exists',
              batchesTopicId: batchesResult?.topicId || 'Already exists',
              error: ordersResult?.error || batchesResult?.error
            });

          } catch (err) {
            results.push({
              marketId: market.id,
              marketName: market.name,
              success: false,
              error: (err as Error).message
            });
          }
        }
        
        // Small delay between batches
        if (i + batchSize < markets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const initResults: TestResults = {
        phase: 'Phase 2.1 - Initialize All Markets',
        results,
        summary: `Processed ${markets.length} markets: ${successCount} successful, ${topicsCreated} new topics created`
      };

      this.testResults.push(initResults);
      return initResults;
    } catch (err) {
      const initResults: TestResults = {
        phase: 'Phase 2.1 - Initialize All Markets',
        results: [{ success: false, error: (err as Error).message }],
        summary: 'Market initialization failed'
      };
      this.testResults.push(initResults);
      return initResults;
    }
  }

  /**
   * Run Complete Phase 1 Test Suite
   */
  async runPhase1TestSuite(): Promise<TestResults[]> {
    console.log('🚀 Starting HCS Topics Test Suite - Phase 1');
    
    const phase1_1 = await this.createIndividualTestTopics();
    const phase1_2 = await this.createMarketSpecificTopics();
    const phase1_3 = await this.validateTopicCreation();

    console.log('✅ Phase 1 Complete');
    return [phase1_1, phase1_2, phase1_3];
  }

  /**
   * Tests the basic Hedera connectivity (simplified test - no topic creation)
   */
  async testCLOBConnectionToHCS(): Promise<TestResults> {
    console.log('🔌 Testing basic Hedera connectivity...')
    
    const startTime = Date.now()
    const results: any[] = []
    
    try {
      console.log('Testing Hedera network connectivity via simple topic creation...')
      
      // Create a simple test topic to verify connectivity
      const testResult = await this.createTopicAndWait('orders', undefined, 'Connectivity test topic');
      
      if (testResult.success) {
        results.push({
          success: true,
          topicId: testResult.topicId,
          requestId: testResult.requestId,
          description: 'Hedera network connectivity verified - topic creation successful',
          connectionTest: true
        })
        
        console.log(`✅ Connectivity test passed - Topic created: ${testResult.topicId}`)
      } else {
        throw new Error(testResult.error || 'Topic creation failed')
      }
      
    } catch (error) {
      console.error('❌ Connectivity test failed:', error)
      
      results.push({
        success: false,
        error: (error as Error).message,
        description: 'Failed to verify Hedera network connectivity',
        connectionTest: true
      })
    }
    
    const duration = Date.now() - startTime
    const summary = results.length > 0 && results[0].success 
      ? `✅ Hedera network connectivity verified (${duration}ms)`
      : `❌ Hedera network connectivity test failed (${duration}ms)`
    
    const result: TestResults = {
      phase: 'Hedera Connectivity Test',
      results,
      summary
    }
    
    this.testResults.push(result)
    return result
  }

  /**
   * Get all test results
   */
  getTestResults(): TestResults[] {
    return this.testResults;
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const report = ['# HCS Topics Test Report', ''];
    
    this.testResults.forEach((result, index) => {
      report.push(`## ${result.phase}`);
      report.push(`**Summary:** ${result.summary}`);
      report.push('');
      
      result.results.forEach((res, i) => {
        if (res.success) {
          report.push(`✅ Success: ${JSON.stringify(res, null, 2)}`);
        } else {
          report.push(`❌ Failed: ${res.error}`);
        }
      });
      report.push('');
    });

    return report.join('\n');
  }

  /**
   * Clear test results
   */
  clearResults() {
    this.testResults = [];
  }
}

export const hcsTopicTester = HCSTopicTester.getInstance();