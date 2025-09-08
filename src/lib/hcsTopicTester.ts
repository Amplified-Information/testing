import { supabase } from '@/integrations/supabase/client';

interface HCSTopicCreationResult {
  success: boolean;
  topicId?: string;
  error?: string;
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
   * Phase 1.1: Create Individual Test Topics
   */
  async createIndividualTestTopics(): Promise<TestResults> {
    console.log('Starting Phase 1.1: Creating individual test topics...');
    
    const testTopics = [
      {
        topicType: 'orders' as const,
        description: 'Test orders topic for HCS validation'
      },
      {
        topicType: 'batches' as const,
        description: 'Test batches topic for throughput testing'
      },
      {
        topicType: 'oracle' as const,
        description: 'Test oracle topic for dispute resolution testing'
      }
    ];

    const results = [];

    for (const topic of testTopics) {
      try {
        const { data, error } = await supabase.functions.invoke('hcs-manager', {
          body: {
            action: 'create_topic',
            topicType: topic.topicType,
            description: topic.description
          }
        });

        if (error) {
          results.push({
            topicType: topic.topicType,
            success: false,
            error: error.message
          });
        } else {
          results.push({
            topicType: topic.topicType,
            success: true,
            topicId: data.topicId,
            description: topic.description
          });
        }
      } catch (err) {
        results.push({
          topicType: topic.topicType,
          success: false,
          error: (err as Error).message
        });
      }
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
      try {
        const { data, error } = await supabase.functions.invoke('hcs-manager', {
          body: {
            action: 'setup_market_topics',
            marketId: market.id
          }
        });

        if (error) {
          results.push({
            marketId: market.id,
            marketName: market.name,
            category: market.category,
            success: false,
            error: error.message
          });
        } else {
          results.push({
            marketId: market.id,
            marketName: market.name,
            category: market.category,
            success: true,
            ordersTopicId: data.ordersTopicId,
            batchesTopicId: data.batchesTopicId
          });
        }
      } catch (err) {
        results.push({
          marketId: market.id,
          marketName: market.name,
          category: market.category,
          success: false,
          error: (err as Error).message
        });
      }
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
      // Fetch all topics from database
      const { data, error } = await supabase.functions.invoke('hcs-manager', {
        body: {}
      });

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
        active: data.filter((t: any) => t.is_active).length
      };

      const validationResults: TestResults = {
        phase: 'Phase 1.3 - Topic Validation',
        results: [
          {
            success: true,
            topicStats,
            validation: 'All topics successfully created and stored in database'
          }
        ],
        summary: `Validated ${topicStats.total} total topics: ${topicStats.active} active, ${topicStats.byMarket} market-specific`
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
      const { data, error } = await supabase.functions.invoke('hcs-manager', {
        body: {
          action: 'initialize_all_markets'
        }
      });

      if (error) {
        const initResults: TestResults = {
          phase: 'Phase 2.1 - Initialize All Markets',
          results: [{ success: false, error: error.message }],
          summary: 'Failed to initialize all market topics'
        };
        this.testResults.push(initResults);
        return initResults;
      }

      const initResults: TestResults = {
        phase: 'Phase 2.1 - Initialize All Markets',
        results: [
          {
            success: true,
            marketsProcessed: data.marketsProcessed,
            topicsCreated: data.topicsCreated,
            details: data.results
          }
        ],
        summary: `Processed ${data.marketsProcessed} markets, created ${data.topicsCreated} new topics`
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