import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HCSJobMonitor } from '@/components/HCS/HCSJobMonitor';
import { useAsyncHCS } from '@/hooks/useAsyncHCS';
import { Zap, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function HCSAsyncTest() {
  const { createTopic, isLoading, activeJobs } = useAsyncHCS();

  const handleCreateTopic = async (topicType: 'orders' | 'batches' | 'oracle' | 'disputes', marketId?: string) => {
    try {
      const result = await createTopic({
        topicType,
        marketId,
        timeout: 120000, // 2 minutes timeout
        onProgress: (job) => {
          console.log(`Job ${job.id} progress:`, job.status);
        },
      });
      console.log('Topic creation job created:', result);
    } catch (error) {
      console.error('Failed to create topic job:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Async HCS Topic Creation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create Hedera Consensus Service topics asynchronously to avoid timeout issues and handle network latency gracefully.
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Queue Status</h3>
              <p className="text-2xl font-bold text-primary">{activeJobs.length}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold">Processing Speed</h3>
              <p className="text-2xl font-bold text-success">~30s</p>
              <p className="text-sm text-muted-foreground">Average Duration</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold">Worker Status</h3>
              <Badge variant="outline" className="text-success border-success">Online</Badge>
              <p className="text-sm text-muted-foreground">Runs every 30s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Why Use Async Topic Creation?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-destructive mb-2">Synchronous Issues:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Edge function timeouts (30s limit)</li>
                <li>• Hedera testnet latency (10-30s)</li>
                <li>• Network congestion failures</li>
                <li>• Poor user experience</li>
                <li>• No retry capabilities</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-success mb-2">Async Benefits:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• No timeout limitations</li>
                <li>• Automatic retry with backoff</li>
                <li>• Queue management</li>
                <li>• Real-time status updates</li>
                <li>• Better error handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Creation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create Topics
          </CardTitle>
          <CardDescription>
            Create different types of HCS topics for CLOB operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => handleCreateTopic('orders')}
              disabled={isLoading}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Zap className="h-6 w-6 mb-2" />
              Orders Topic
            </Button>
            <Button
              onClick={() => handleCreateTopic('batches')}
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Zap className="h-6 w-6 mb-2" />
              Batches Topic
            </Button>
            <Button
              onClick={() => handleCreateTopic('oracle')}
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Zap className="h-6 w-6 mb-2" />
              Oracle Topic
            </Button>
            <Button
              onClick={() => handleCreateTopic('disputes')}
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Zap className="h-6 w-6 mb-2" />
              Disputes Topic
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">Market-Specific Topics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleCreateTopic('orders', 'sample-market-id')}
                disabled={isLoading}
                variant="secondary"
                className="justify-start"
              >
                Create Orders Topic for Sample Market
              </Button>
              <Button
                onClick={() => handleCreateTopic('batches', 'sample-market-id')}
                disabled={isLoading}
                variant="secondary"
                className="justify-start"
              >
                Create Batches Topic for Sample Market
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Monitor */}
      <HCSJobMonitor showHistory={true} compact={false} />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>How It Works:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. <strong>Job Creation:</strong> Topic creation requests are queued in the database</li>
              <li>2. <strong>Worker Processing:</strong> A cron job runs every 30 seconds to process queued jobs</li>
              <li>3. <strong>Atomic Claims:</strong> Jobs are claimed atomically to prevent duplicate processing</li>
              <li>4. <strong>Hedera Integration:</strong> Worker creates topics using system credentials</li>
              <li>5. <strong>Status Updates:</strong> Real-time status updates via database polling</li>
              <li>6. <strong>Error Handling:</strong> Automatic retries with exponential backoff</li>
            </ol>
            
            <h4 className="mt-6">Architecture Benefits:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Scalable: Handle multiple concurrent requests</li>
              <li>• Resilient: Survives network issues and restarts</li>
              <li>• Observable: Full audit trail and monitoring</li>
              <li>• Maintainable: Clean separation of concerns</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          The async HCS system automatically handles Hedera testnet latency and network issues.
          Jobs are processed reliably in the background with full error recovery.
        </p>
      </div>
    </div>
  );
}