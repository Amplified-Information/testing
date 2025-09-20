import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlayCircle, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectivityTestResult {
  test: string;
  status: 'success' | 'failure' | 'timeout' | 'partial';
  duration: number;
  details: any;
  error?: string;
}

interface TestSummary {
  totalTests: number;
  successful: number;
  failed: number;
  partial: number;
  timeout: number;
  totalDuration: number;
}

interface ConnectivityResponse {
  success: boolean;
  timestamp: string;
  summary: TestSummary;
  results: ConnectivityTestResult[];
  error?: string;
}

export const HederaConnectivityTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ConnectivityResponse | null>(null);

  const runConnectivityTest = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🚀 Starting Hedera connectivity test...');
      
      const { data, error } = await supabase.functions.invoke('hedera-connectivity-test', {
        body: {}
      });

      if (error) {
        throw new Error(`Function invocation failed: ${error.message}`);
      }

      console.log('📊 Connectivity test completed:', data);
      setResults(data);
      
      if (data.success) {
        toast.success(`Connectivity test completed. ${data.summary.successful}/${data.summary.totalTests} tests passed.`);
      } else {
        toast.error(`Connectivity test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('💥 Connectivity test error:', error);
      toast.error(`Connectivity test failed: ${error.message}`);
      setResults({
        success: false,
        timestamp: new Date().toISOString(),
        summary: { totalTests: 0, successful: 0, failed: 1, partial: 0, timeout: 0, totalDuration: 0 },
        results: [],
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'timeout': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      failure: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      timeout: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <Badge variant="outline" className={colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Hedera Network Connectivity Test
          </CardTitle>
          <CardDescription>
            Comprehensive diagnostics to identify network connectivity issues between Supabase Edge Functions and Hedera testnet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runConnectivityTest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Connectivity Test...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Full Connectivity Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <Badge variant="outline" className="text-xs">
                {new Date(results.timestamp).toLocaleString()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {results.success ? 'Connectivity test completed' : 'Connectivity test failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.summary.partial}</div>
                <div className="text-sm text-muted-foreground">Partial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{results.summary.timeout}</div>
                <div className="text-sm text-muted-foreground">Timeout</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.totalDuration}ms</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-3">
              {results.results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <h4 className="font-medium">{result.test}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <Badge variant="secondary" className="text-xs">
                        {result.duration}ms
                      </Badge>
                    </div>
                  </div>

                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.details && Object.keys(result.details).length > 0 && (
                    <div className="text-sm">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-muted-foreground mb-1">
                          View Details
                        </summary>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Global Error */}
            {!results.success && results.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                <strong>Global Error:</strong> {results.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Information */}
      <Card>
        <CardHeader>
          <CardTitle>What This Test Reveals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>DNS Resolution:</strong> Tests if Hedera node hostnames can be resolved to IP addresses.
          </div>
          <div>
            <strong>Node Connectivity:</strong> Tests basic network connectivity to individual Hedera testnet nodes.
          </div>
          <div>
            <strong>Hedera Client Init:</strong> Tests if the Hedera SDK can initialize properly with credentials.
          </div>
          <div>
            <strong>Account Balance Query:</strong> Tests the simplest Hedera operation - querying account balance.
          </div>
          <div>
            <strong>HCS Topic Creation:</strong> Tests the actual operation that's been failing - creating HCS topics.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};