import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Play, FileText } from 'lucide-react';
import { hcsTopicTester } from '@/lib/hcsTopicTester';
import { toast } from 'sonner';

interface TestResult {
  phase: string;
  results: any[];
  summary: string;
}

export const HCSTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isConnectionTesting, setIsConnectionTesting] = useState(false);
  const [isWorkerManagement, setIsWorkerManagement] = useState(false);

  const testCLOBConnection = async () => {
    setIsConnectionTesting(true);
    
    try {
      toast.info('Testing Hedera network connectivity...');
      const result = await hcsTopicTester.testCLOBConnectionToHCS();
      
      // Add the result to existing results or create new array
      setTestResults(prev => [result, ...prev]);
      
      if (result.results.length > 0 && result.results[0].success) {
        toast.success('Hedera connectivity test passed!');
      } else {
        toast.error('Hedera connectivity test failed!');
      }
    } catch (error) {
      console.error('Connectivity test execution failed:', error);
      toast.error('Connectivity test execution failed: ' + (error as Error).message);
    } finally {
      setIsConnectionTesting(false);
    }
  };

  const resetWorkerAndJobs = async () => {
    setIsWorkerManagement(true);
    
    try {
      toast.info('Resetting stuck jobs and triggering worker...');
      const result = await hcsTopicTester.resetStuckJobsAndTriggerWorker();
      
      setTestResults(prev => [result, ...prev]);
      
      if (result.results.length > 0 && result.results[0].success) {
        toast.success('Worker management completed successfully!');
      } else {
        toast.error('Worker management failed!');
      }
    } catch (error) {
      console.error('Worker management failed:', error);
      toast.error('Worker management failed: ' + (error as Error).message);
    } finally {
      setIsWorkerManagement(false);
    }
  };

  const runPhase1Tests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    
    try {
      setCurrentPhase('Creating individual test topics...');
      setProgress(20);
      
      const phase1_1 = await hcsTopicTester.createIndividualTestTopics();
      setTestResults([phase1_1]);
      
      setCurrentPhase('Setting up market-specific topics...');
      setProgress(50);
      
      const phase1_2 = await hcsTopicTester.createMarketSpecificTopics();
      setTestResults([phase1_1, phase1_2]);
      
      setCurrentPhase('Validating topic creation...');
      setProgress(80);
      
      const phase1_3 = await hcsTopicTester.validateTopicCreation();
      setTestResults([phase1_1, phase1_2, phase1_3]);
      
      setProgress(100);
      setCurrentPhase('Phase 1 Complete!');
      
      toast.success('HCS Phase 1 tests completed successfully!');
    } catch (error) {
      console.error('Test execution failed:', error);
      toast.error('Test execution failed: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const runPhase2Tests = async () => {
    setIsRunning(true);
    setCurrentPhase('Initializing all market topics...');
    
    try {
      const phase2Results = await hcsTopicTester.initializeAllmarkets();
      setTestResults(prev => [...prev, phase2Results]);
      toast.success('Phase 2 initialization completed!');
    } catch (error) {
      console.error('Phase 2 execution failed:', error);
      toast.error('Phase 2 execution failed: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
      setCurrentPhase('');
    }
  };

  const generateReport = () => {
    const report = hcsTopicTester.generateTestReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hcs-test-report.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Test report downloaded!');
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">HCS Topics Test Runner</h1>
        <p className="text-muted-foreground">
          Execute the HCS topic creation and validation test plan
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Run the phased HCS topic testing plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Button
              onClick={testCLOBConnection}
              disabled={isRunning || isConnectionTesting || isWorkerManagement}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isConnectionTesting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Test Hedera Network
            </Button>
            
            <Button
              onClick={resetWorkerAndJobs}
              disabled={isRunning || isConnectionTesting || isWorkerManagement}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isWorkerManagement ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Reset Worker
            </Button>
            
            <Button
              onClick={runPhase1Tests}
              disabled={isRunning || isConnectionTesting || isWorkerManagement}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Phase 1 Tests
            </Button>
            
            <Button
              onClick={runPhase2Tests}
              disabled={isRunning || isConnectionTesting || isWorkerManagement || testResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Phase 2 (Initialize All)
            </Button>
            
            <Button
              onClick={generateReport}
              disabled={testResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download Report
            </Button>
          </div>
          
          {isConnectionTesting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Testing Hedera network connectivity...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {isRunning && !isConnectionTesting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentPhase}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{result.phase}</span>
                  <Badge variant={result.results.every(r => r.success) ? "default" : "destructive"}>
                    {result.results.every(r => r.success) ? "Passed" : "Failed"}
                  </Badge>
                </CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.results.map((res, i) => (
                    <Alert key={i} variant={res.success ? "default" : "destructive"}>
                      <div className="flex items-start gap-2">
                        {getStatusIcon(res.success)}
                        <div className="flex-1">
                          <AlertDescription>
                            {res.success ? (
                              <div className="space-y-1">
                                {res.topicId && <div><strong>Topic ID:</strong> {res.topicId}</div>}
                                {res.ordersTopicId && <div><strong>Orders Topic:</strong> {res.ordersTopicId}</div>}
                                {res.batchesTopicId && <div><strong>Batches Topic:</strong> {res.batchesTopicId}</div>}
                                {res.marketName && <div><strong>Market:</strong> {res.marketName}</div>}
                                {res.topicStats && (
                                  <div>
                                    <strong>Statistics:</strong> {res.topicStats.total} total topics, 
                                    {res.topicStats.active} active, {res.topicStats.byMarket} market-specific
                                  </div>
                                )}
                                 {res.topicsCreated && (
                                   <div><strong>Topics Created:</strong> {res.topicsCreated}</div>
                                 )}
                                 {res.connectionTest && (
                                   <div><strong>Connectivity Test:</strong> ✅ Successfully verified Hedera network connectivity</div>
                                 )}
                                 {res.requestId && (
                                   <div><strong>Request ID:</strong> {res.requestId}</div>
                                 )}
                                 {res.timing && (
                                   <div><strong>Response Time:</strong> {res.timing.totalDuration || res.timing.duration || 'N/A'}ms</div>
                                 )}
                                 {res.requestId && (
                                   <div><strong>Request ID:</strong> {res.requestId}</div>
                                 )}
                                 {res.description && <div><strong>Description:</strong> {res.description}</div>}
                              </div>
                            ) : (
                              <div><strong>Error:</strong> {res.error}</div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Test Plan Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Test Plan Overview</CardTitle>
          <CardDescription>
            Phased approach to HCS topic creation and validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Phase 0: Connectivity Test</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Test Hedera network connectivity</li>
                <li>• Validate topic creation capability</li> 
                <li>• Use async job polling architecture</li>
                <li>• Verify job queue processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Phase 1: Basic Setup & Testing</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Create 3 individual test topics</li>
                <li>• Setup topics for 3 selected markets</li>
                <li>• Validate topic creation and storage</li>
              </ul>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Phase 2: Comprehensive Initialization</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Initialize topics for all remaining markets</li>
                <li>• Bulk topic creation and organization</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Future Phases</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Integration & functional testing</li>
                <li>• Performance & throughput testing</li>
                <li>• Monitoring & alerting setup</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Selected Test Markets</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Sports:</strong> "Which team will win the 2026 NBA Championship?"</li>
              <li>• <strong>Technology:</strong> "Which tech company will have the highest market cap in 2027?"</li>
              <li>• <strong>Politics:</strong> "Who will be the Republican nominee for President in 2028?"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};