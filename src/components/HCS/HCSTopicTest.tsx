import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Play, RotateCcw, Zap, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAsyncHCS } from '@/hooks/useAsyncHCS';
import { HCSJobMonitor } from '@/components/HCS/HCSJobMonitor';

export interface HCSTestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

export default function HCSTopicTest() {
  const [results, setResults] = useState<HCSTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { createTopic, clearAllJobs, isLoading: isAsyncLoading } = useAsyncHCS();

  const callHCSFunction = async (action: string, topicId?: string, message?: string): Promise<HCSTestResult> => {
    const { data, error } = await supabase.functions.invoke('hcs-test', {
      body: { action, topicId, message }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.result;
  };

  const runCompleteTest = async (): Promise<HCSTestResult[]> => {
    const { data, error } = await supabase.functions.invoke('hcs-test', {
      body: { action: 'completeTest' }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.results;
  };

  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const testResults = await runCompleteTest();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
      const errorResult: HCSTestResult = {
        step: 'Test Failed',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
      setResults([errorResult]);
    } finally {
      setIsRunning(false);
    }
  };

  const runIndividualStep = async (step: 'init' | 'balance' | 'create' | 'message') => {
    setIsRunning(true);
    
    try {
      let result: HCSTestResult;
      
      switch (step) {
        case 'init':
          result = await callHCSFunction('initialize');
          break;
        case 'balance':
          result = await callHCSFunction('balance');
          break;
        case 'create':
          result = await callHCSFunction('createTopic', undefined, "Individual Test - " + new Date().toISOString());
          break;
        case 'message':
          const lastCreateResult = results.find(r => r.step === 'Create Topic' && r.status === 'success');
          if (lastCreateResult?.data?.topicId) {
            result = await callHCSFunction('submitMessage', lastCreateResult.data.topicId, `Individual test message - ${new Date().toISOString()}`);
          } else {
            result = {
              step: 'Submit Message',
              status: 'error',
              message: 'No topic available - create a topic first',
              timestamp: new Date().toISOString()
            };
          }
          break;
        default:
          return;
      }
      
      setResults(prev => [...prev, result]);
    } catch (error) {
      console.error('Individual step failed:', error);
      const errorResult: HCSTestResult = {
        step: 'Individual Step Failed',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAsyncTopicCreation = async (topicType: 'orders' | 'batches' | 'oracle' | 'disputes') => {
    try {
      await createTopic({
        topicType,
        onProgress: (job) => {
          console.log('Job progress:', job);
        },
        timeout: 60000,
      });
    } catch (error) {
      console.error('Async topic creation failed:', error);
    }
  };

  const getStatusIcon = (status: HCSTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: HCSTestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HCS Topic Test</h1>
        <p className="text-muted-foreground">
          Test Hedera Consensus Service functionality with both synchronous and asynchronous approaches.
        </p>
      </div>

      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sync">Synchronous Testing</TabsTrigger>
          <TabsTrigger value="async">Asynchronous System</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Synchronous Test Controls
              </CardTitle>
              <CardDescription>
                Run individual tests or a complete test suite (may timeout on testnet)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={runTest} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run Complete Test
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button variant="outline" onClick={() => runIndividualStep('init')} disabled={isRunning} size="sm">
                  1. Initialize
                </Button>
                <Button variant="outline" onClick={() => runIndividualStep('balance')} disabled={isRunning} size="sm">
                  2. Check Balance
                </Button>
                <Button variant="outline" onClick={() => runIndividualStep('create')} disabled={isRunning} size="sm">
                  3. Create Topic
                </Button>
                <Button variant="outline" onClick={() => runIndividualStep('message')} disabled={isRunning} size="sm">
                  4. Submit Message
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button variant="ghost" onClick={() => setResults([])} disabled={isRunning} size="sm">
                  Clear Results
                </Button>
                <Button variant="ghost" onClick={clearAllJobs} disabled={isRunning || isAsyncLoading} size="sm" className="text-destructive hover:text-destructive">
                  Clear All Jobs
                </Button>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Synchronous Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{result.step}</h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(result.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm ${result.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="async" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Asynchronous Topic Creation
              </CardTitle>
              <CardDescription>
                Create HCS topics asynchronously to avoid timeout issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['orders', 'batches', 'oracle', 'disputes'] as const).map((topicType) => (
                  <Button 
                    key={topicType}
                    onClick={() => handleAsyncTopicCreation(topicType)}
                    disabled={isAsyncLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isAsyncLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {topicType.charAt(0).toUpperCase() + topicType.slice(1)} Topic
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <HCSJobMonitor showHistory={true} compact={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}