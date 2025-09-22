import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HCSRequest {
  id: number;
  memo?: string;
  status: 'pending' | 'created' | 'confirmed' | 'failed';
  topic_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  mirror_confirmed_at?: string;
}

interface TestResult {
  id: string;
  testName: string;
  status: 'running' | 'success' | 'failed' | 'timeout';
  startTime: number;
  duration?: number;
  error?: string;
  topicId?: string;
}

interface UseSimpleHCSTestingReturn {
  createTopic: (memo?: string, topicType?: string) => Promise<HCSRequest | null>;
  runSingleTest: (testName: string) => Promise<void>;
  runBatchTest: () => Promise<void>;
  testResults: TestResult[];
  isLoading: boolean;
  isRunningBatch: boolean;
  clearResults: () => void;
  error: string | null;
}

export function useSimpleHCSTesting(): UseSimpleHCSTestingReturn {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createTopic = async (memo?: string, topicType = 'test'): Promise<HCSRequest | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('request-hcs-topic', {
        body: { memo: memo || `${topicType} topic creation test`, topicType }
      });

      if (error) throw error;

      if (data?.requestId) {
        // Fetch the created request
        const { data: request, error: fetchError } = await supabase
          .from('hcs_requests')
          .select('*')
          .eq('id', data.requestId)
          .single();

        if (fetchError) throw fetchError;

        toast({
          title: "Topic Creation Started",
          description: "Your topic is being created on Hedera testnet.",
        });

        return request as HCSRequest;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: "Failed to Create Topic",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const runSingleTest = async (testName: string) => {
    const testId = `test-${Date.now()}`;
    const startTime = Date.now();

    const newTest: TestResult = {
      id: testId,
      testName,
      status: 'running',
      startTime
    };

    setTestResults(prev => [newTest, ...prev]);

    try {
      const result = await createTopic(undefined, 'orders');
      
      if (result) {
        // Monitor completion with simple polling
        const checkCompletion = setInterval(async () => {
          const { data: request } = await supabase
            .from('hcs_requests')
            .select('*')
            .eq('id', result.id)
            .single();

          if (request) {
            const duration = Date.now() - startTime;
            
            if (request.status === 'confirmed') {
              clearInterval(checkCompletion);
              setTestResults(prev => prev.map(t => 
                t.id === testId 
                  ? { ...t, status: 'success', duration, topicId: request.topic_id }
                  : t
              ));
            } else if (request.status === 'failed') {
              clearInterval(checkCompletion);
              setTestResults(prev => prev.map(t => 
                t.id === testId 
                  ? { ...t, status: 'failed', duration, error: request.error_message }
                  : t
              ));
            }
          }

          // Timeout after 2 minutes
          if (Date.now() - startTime > 120000) {
            clearInterval(checkCompletion);
            setTestResults(prev => prev.map(t => 
              t.id === testId 
                ? { ...t, status: 'timeout', duration: Date.now() - startTime, error: 'Test timeout after 2 minutes' }
                : t
            ));
          }
        }, 2000);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => prev.map(t => 
        t.id === testId 
          ? { ...t, status: 'failed', duration, error: (error as Error).message }
          : t
      ));
    }
  };

  const runBatchTest = async () => {
    setIsRunningBatch(true);
    
    const batchTests = [
      'Orders Topic - Simple Test',
      'Batches Topic - Simple Test', 
      'Oracle Topic - Simple Test',
      'Disputes Topic - Simple Test',
      'Rapid Fire Test'
    ];

    for (let i = 0; i < batchTests.length; i++) {
      await runSingleTest(batchTests[i]);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunningBatch(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return {
    createTopic,
    runSingleTest,
    runBatchTest,
    testResults,
    isLoading,
    isRunningBatch,
    clearResults,
    error,
  };
}