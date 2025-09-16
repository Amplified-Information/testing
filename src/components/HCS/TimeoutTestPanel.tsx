import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAsyncHCS } from '@/hooks/useAsyncHCS';
import { 
  TestTube, 
  Timer, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface TestResult {
  id: string;
  testName: string;
  status: 'running' | 'success' | 'failed' | 'timeout';
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  jobId?: string;
}

export function TimeoutTestPanel() {
  const { createTopic, activeJobs, jobHistory } = useAsyncHCS();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    successRate: 0,
    avgDuration: 0,
    timeoutCount: 0,
    totalTests: 0
  });

  // Single timeout-prone topic creation test
  const runSingleTimeoutTest = async (testName: string) => {
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
      console.log(`🧪 Starting timeout test: ${testName}`);
      const result = await createTopic({
        topicType: 'orders',
        marketId: undefined
      });

      // Monitor job completion
      const checkCompletion = setInterval(() => {
        const job = [...activeJobs, ...jobHistory].find(j => j.id === result.jobId);
        if (job) {
          const duration = Date.now() - startTime;
          
          if (job.status === 'confirmed') {
            clearInterval(checkCompletion);
            setTestResults(prev => prev.map(t => 
              t.id === testId 
                ? { ...t, status: 'success', endTime: Date.now(), duration, jobId: result.jobId }
                : t
            ));
          } else if (job.status === 'failed') {
            clearInterval(checkCompletion);
            setTestResults(prev => prev.map(t => 
              t.id === testId 
                ? { 
                    ...t, 
                    status: job.error?.includes('timeout') ? 'timeout' : 'failed', 
                    endTime: Date.now(), 
                    duration, 
                    error: job.error,
                    jobId: result.jobId 
                  }
                : t
            ));
          }
        }

        // Timeout after 2 minutes
        if (Date.now() - startTime > 120000) {
          clearInterval(checkCompletion);
          setTestResults(prev => prev.map(t => 
            t.id === testId 
              ? { 
                  ...t, 
                  status: 'timeout', 
                  endTime: Date.now(), 
                  duration: Date.now() - startTime,
                  error: 'Test timeout after 2 minutes'
                }
              : t
          ));
        }
      }, 1000);

    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => prev.map(t => 
        t.id === testId 
          ? { 
              ...t, 
              status: 'failed', 
              endTime: Date.now(), 
              duration,
              error: (error as Error).message 
            }
          : t
      ));
    }
  };

  // Batch timeout stress test
  const runBatchTimeoutTest = async () => {
    setIsRunningBatch(true);
    console.log('🚀 Starting batch timeout stress test...');

    const batchTests = [
      'Orders Topic - High Load',
      'Batches Topic - Network Stress',
      'Oracle Topic - Timeout Resilience',
      'Disputes Topic - Retry Testing',
      'Orders Topic - Rapid Fire'
    ];

    for (let i = 0; i < batchTests.length; i++) {
      await runSingleTimeoutTest(batchTests[i]);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsRunningBatch(false);
  };

  // Update network statistics
  useEffect(() => {
    const completed = testResults.filter(t => t.status !== 'running');
    const successful = completed.filter(t => t.status === 'success');
    const timeouts = completed.filter(t => t.status === 'timeout');
    const avgDuration = completed.length > 0 
      ? completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length
      : 0;

    setNetworkStats({
      successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
      avgDuration: avgDuration,
      timeoutCount: timeouts.length,
      totalTests: completed.length
    });
  }, [testResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <Timer className="h-4 w-4 text-orange-500" />;
      default: return <TestTube className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            HCS Timeout Testing Suite
          </CardTitle>
          <CardDescription>
            Test the enhanced timeout configurations and retry mechanisms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => runSingleTimeoutTest('Single Timeout Test')}
              disabled={isRunningBatch}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Single Test
            </Button>
            <Button 
              onClick={runBatchTimeoutTest}
              disabled={isRunningBatch}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Batch Stress Test
            </Button>
            <Button 
              onClick={() => setTestResults([])}
              variant="outline"
              size="sm"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Network Performance Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStats.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(networkStats.avgDuration / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {networkStats.timeoutCount}
              </div>
              <div className="text-sm text-muted-foreground">Timeouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {networkStats.totalTests}
              </div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Real-time results from timeout testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No test results yet. Run a test to see timeout performance metrics.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {testResults.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.testName}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(test.startTime).toLocaleTimeString()}
                        {test.duration && ` • Duration: ${(test.duration / 1000).toFixed(1)}s`}
                        {test.jobId && ` • Job: ${test.jobId.slice(0, 8)}...`}
                      </p>
                      {test.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {test.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">1. Monitor Edge Function Logs</p>
              <p className="text-muted-foreground">
                Check process-topic-jobs function logs for detailed timeout handling
              </p>
            </div>
            <div>
              <p className="font-medium">2. Database Status Tracking</p>
              <p className="text-muted-foreground">
                Watch job status changes: pending → connecting → submitting → submitted/failed
              </p>
            </div>
            <div>
              <p className="font-medium">3. Retry Mechanism Testing</p>
              <p className="text-muted-foreground">
                Failed jobs should retry up to 5 times with exponential backoff
              </p>
            </div>
            <div>
              <p className="font-medium">4. Success Metrics</p>
              <p className="text-muted-foreground">
                Target: &gt;80% success rate, &lt;30s average duration, &lt;3 timeouts per 10 tests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}