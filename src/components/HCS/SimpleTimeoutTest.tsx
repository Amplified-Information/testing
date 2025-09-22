import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSimpleHCSTesting } from '@/hooks/useSimpleHCSTesting';
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

export function SimpleTimeoutTest() {
  const { 
    testResults, 
    runSingleTest, 
    runBatchTest, 
    isRunningBatch, 
    clearResults 
  } = useSimpleHCSTesting();

  const [networkStats, setNetworkStats] = useState({
    successRate: 0,
    avgDuration: 0,
    timeoutCount: 0,
    totalTests: 0
  });

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
            Simple HCS Testing Suite
          </CardTitle>
          <CardDescription>
            Test HCS topic creation with simple, direct approach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => runSingleTest('Single Timeout Test')}
              disabled={isRunningBatch}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Single Test
            </Button>
            <Button 
              onClick={runBatchTest}
              disabled={isRunningBatch}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Batch Test
            </Button>
            <Button 
              onClick={clearResults}
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
            Performance Stats
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
            Real-time results from HCS testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No test results yet. Run a test to see performance metrics.
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
                        {test.topicId && ` • Topic: ${test.topicId}`}
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
    </div>
  );
}