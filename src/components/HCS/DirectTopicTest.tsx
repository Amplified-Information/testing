import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Play, Zap, Target } from 'lucide-react';
import { directHcsTest } from '@/lib/directHcsTest';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  topicId?: string;
  topicType?: string;
  marketName?: string;
  error?: string;
  timing?: { duration: number };
}

export const DirectTopicTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isTestingSingle, setIsTestingSingle] = useState(false);

  const runDirectMarketTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setCurrentStep('Initializing direct HCS test...');
    
    try {
      toast.info('Starting direct HCS topic creation test...');
      
      setCurrentStep('Fetching Hedera credentials...');
      setProgress(10);
      
      setCurrentStep('Creating market topics directly...');
      setProgress(30);
      
      const results = await directHcsTest.createMarketTopics();
      setTestResults(results);
      
      setProgress(90);
      setCurrentStep('Finalizing test results...');
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      setProgress(100);
      setCurrentStep(`Test completed! ${successCount}/${totalCount} topics created successfully.`);
      
      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} HCS topics!`);
      } else {
        toast.error('Failed to create any HCS topics.');
      }
      
    } catch (error) {
      console.error('Direct HCS test failed:', error);
      toast.error('Direct HCS test failed: ' + (error as Error).message);
      setCurrentStep('Test failed!');
    } finally {
      setIsRunning(false);
    }
  };

  const testSingleTopic = async (topicType: 'orders' | 'batches' | 'oracle' | 'disputes') => {
    setIsTestingSingle(true);
    
    try {
      toast.info(`Testing single ${topicType} topic creation...`);
      const result = await directHcsTest.testSingleTopicCreation(topicType);
      
      setTestResults(prev => [result, ...prev]);
      
      if (result.success) {
        toast.success(`Successfully created ${topicType} topic!`);
      } else {
        toast.error(`Failed to create ${topicType} topic.`);
      }
      
    } catch (error) {
      console.error(`Single ${topicType} topic test failed:`, error);
      toast.error(`Single ${topicType} topic test failed: ` + (error as Error).message);
    } finally {
      setIsTestingSingle(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setProgress(0);
    setCurrentStep('');
    toast.info('Test results cleared.');
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;
  const hasResults = testResults.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            Direct HCS Topic Creation Test
          </CardTitle>
          <CardDescription>
            Simple, synchronous HCS topic creation bypassing the job queue system.
            Creates topics directly using the HCSService and provides immediate feedback.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Create HCS topics directly without background jobs or polling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={runDirectMarketTest}
              disabled={isRunning || isTestingSingle}
              className="flex items-center gap-2"
              size="lg"
            >
              {isRunning ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              Create Market Topics
            </Button>
            
            <Button
              onClick={clearResults}
              disabled={isRunning || isTestingSingle || !hasResults}
              variant="outline"
              className="flex items-center gap-2"
            >
              Clear Results
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasResults && (
                <Badge variant={successCount === totalCount ? "default" : "destructive"}>
                  {successCount}/{totalCount} Success
                </Badge>
              )}
            </div>
          </div>

          {/* Single Topic Tests */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Single Topic Tests</h4>
            <div className="grid gap-2 md:grid-cols-4">
              {(['orders', 'batches', 'oracle', 'disputes'] as const).map(topicType => (
                <Button
                  key={topicType}
                  onClick={() => testSingleTopic(topicType)}
                  disabled={isRunning || isTestingSingle}
                  variant="outline"
                  size="sm"
                  className="capitalize"
                >
                  {isTestingSingle ? (
                    <Clock className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  {topicType}
                </Button>
              ))}
            </div>
          </div>
          
          {(isRunning || isTestingSingle) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                {isRunning && <span>{progress}%</span>}
              </div>
              <Progress value={isRunning ? progress : 50} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <Badge variant={successCount === totalCount ? "default" : "destructive"}>
                {successCount}/{totalCount} Successful
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time results from direct HCS topic creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.success)}
                    <div className="flex-1 space-y-1">
                      <AlertDescription>
                        {result.success ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              ✅ {result.topicType?.toUpperCase()} Topic Created Successfully
                            </div>
                            {result.topicId && (
                              <div className="font-mono text-xs bg-muted p-2 rounded">
                                Topic ID: {result.topicId}
                              </div>
                            )}
                            {result.marketName && (
                              <div className="text-sm text-muted-foreground">
                                Market: {result.marketName}
                              </div>
                            )}
                            {result.timing && (
                              <div className="text-sm text-muted-foreground">
                                Created in {result.timing.duration}ms
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-medium text-destructive">
                              ❌ {result.topicType?.toUpperCase()} Topic Creation Failed
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.error}
                            </div>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>How This Test Works</CardTitle>
          <CardDescription>
            Understanding the direct HCS topic creation approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">What This Test Does</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Fetches Hedera credentials from Supabase secrets</li>
                <li>• Creates topics directly using HCSService (no job queue)</li>
                <li>• Creates 4 topic types: orders, batches, oracle, disputes</li>
                <li>• Stores successful topics in hcs_topics table</li>
                <li>• Tests message submission to verify topics work</li>
                <li>• Provides immediate success/failure feedback</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Benefits vs Job Queue</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Immediate results (no polling/waiting)</li>
                <li>• Simple retry logic (3 attempts with backoff)</li>
                <li>• No background workers or complex state management</li>
                <li>• Easy debugging when failures occur</li>
                <li>• Direct proof that HCS integration works</li>
                <li>• Foundation for building CLOB functionality</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Proof of Concept Goal:</strong> This test demonstrates that we can successfully 
              create HCS topics and submit messages. If this works, we can build the rest of the 
              CLOB system on this foundation without complex job management.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};