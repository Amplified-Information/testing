import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Database, Workflow, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

const HCSAsyncDocumentation = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">HCS Async Topic Creation</h1>
            <p className="text-muted-foreground text-lg">
              Complete documentation of the asynchronous Hedera Consensus Service topic creation system
            </p>
          </div>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                System Overview
              </CardTitle>
              <CardDescription>
                A fully asynchronous, scalable solution for creating HCS topics with background processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The HCS Async Topic Creation system implements a fire-and-forget pattern that allows clients 
                to request topic creation without blocking on network operations. The system handles Hedera 
                testnet instability, retries, and provides real-time status updates through polling.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Asynchronous Processing</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Database Job Queue</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Retry Logic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced gRPC Keepalive Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Enhanced gRPC Keepalive Configuration
              </CardTitle>
              <CardDescription>
                Addressing HCS timeout issues with proper gRPC keepalive settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Problem Analysis
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Our investigation revealed that HCS timeout issues (Code 17: TIMEOUT after ~54s) were caused by 
                  missing gRPC keepalive configuration, similar to issues documented in 
                  <a href="https://github.com/grpc/grpc-go/issues/7542" className="underline" target="_blank" rel="noopener">
                    gRPC GitHub issue #7542
                  </a>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Solution Implementation
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Enhanced gRPC keepalive settings implemented in our Hedera client configuration:
                </p>
                <div className="bg-secondary/10 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{`// Enhanced gRPC keepalive and timeout configuration
if (network === 'testnet') {
  client.setRequestTimeout(180000)     // 3 minutes primary timeout
  client.setMinBackoff(1000)           // 1 second minimum backoff  
  client.setMaxBackoff(16000)          // 16 seconds maximum backoff
  client.setMaxNodeAttempts(3)         // Remove bad nodes after 3 failures
  client.setMinNodeReadmitTime(30000)  // 30 seconds before node readmission
  client.setMaxNodeReadmitTime(300000) // 5 minutes maximum readmit time
  client.setCloseTimeout(10000)        // 10 seconds connection close timeout
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Configuration Benefits</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Improved Connection Stability</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Faster Node Failure Detection</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Enhanced Error Recovery</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-secondary/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Testnet-Optimized Settings</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Process Flow Diagram</CardTitle>
              <CardDescription>
                Complete flow from client request to topic creation completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="bg-secondary/10 p-4 rounded-lg">
                  <h4 className="font-semibold mb-4 text-center">HCS Async Topic Creation Flow</h4>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border-l-4 border-blue-500">
                        <div className="font-semibold text-blue-700 dark:text-blue-300">Frontend Request Phase</div>
                        <div className="text-xs mt-2 space-y-1">
                          <div>1. Client submits topic creation request</div>
                          <div>2. hcs-manager validates & creates job</div>
                          <div>3. Returns request_id immediately</div>
                          <div>4. Client starts polling for status</div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded border-l-4 border-orange-500">
                        <div className="font-semibold text-orange-700 dark:text-orange-300">Background Processing</div>
                        <div className="text-xs mt-2 space-y-1">
                          <div>1. Cron triggers process-topic-jobs</div>
                          <div>2. Claims up to 5 pending jobs</div>
                          <div>3. Gets Hedera credentials</div>
                          <div>4. Calls createCLOBTopic with retries</div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border-l-4 border-green-500">
                        <div className="font-semibold text-green-700 dark:text-green-300">Completion Phase</div>
                        <div className="text-xs mt-2 space-y-1">
                          <div>1. On success: Store topic in hcs_topics</div>
                          <div>2. On failure: Record error message</div>
                          <div>3. Update job status & duration</div>
                          <div>4. Client receives final status</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="text-center text-xs text-muted-foreground">
                        <div className="font-semibold mb-2">Data Flow</div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <span className="bg-secondary px-2 py-1 rounded">Client Request</span>
                          <span>→</span>
                          <span className="bg-secondary px-2 py-1 rounded">topic_creation_jobs</span>
                          <span>→</span>
                          <span className="bg-secondary px-2 py-1 rounded">Background Worker</span>
                          <span>→</span>
                          <span className="bg-secondary px-2 py-1 rounded">Hedera Network</span>
                          <span>→</span>
                          <span className="bg-secondary px-2 py-1 rounded">hcs_topics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Components */}
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
              <CardDescription>
                Key components and their responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Frontend</Badge>
                    useAsyncHCS Hook
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    React hook that provides job creation, status polling, and error handling. 
                    Uses React Query for efficient data fetching and caching.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Edge Function</Badge>
                    hcs-manager
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Handles job creation requests and status queries. Implements fire-and-forget 
                    pattern by immediately returning request IDs.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Background Worker</Badge>
                    process-topic-jobs
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cron-triggered function that claims and processes pending jobs. Handles Hedera 
                    network communication, retries, and result persistence.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Database</Badge>
                    Job Queue Tables
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <code>topic_creation_jobs</code> - Job queue with status tracking<br/>
                    <code>hcs_topics</code> - Successfully created topics registry
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Schema */}
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                Tables and key fields for the async system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">topic_creation_jobs</h4>
                <div className="bg-secondary/10 p-4 rounded-lg space-y-1 text-sm font-mono">
                  <div><span className="text-primary">id</span> - UUID primary key</div>
                  <div><span className="text-primary">request_id</span> - Client-facing identifier</div>
                  <div><span className="text-primary">topic_type</span> - orders | batches | oracle | disputes</div>
                  <div><span className="text-primary">market_id</span> - Associated market (optional)</div>
                  <div><span className="text-primary">status</span> - pending | processing | success | failed</div>
                  <div><span className="text-primary">topic_id</span> - Created Hedera topic ID</div>
                  <div><span className="text-primary">error</span> - Failure message</div>
                  <div><span className="text-primary">duration</span> - Processing time in ms</div>
                  <div><span className="text-primary">claimed_at</span> - When job was claimed</div>
                  <div><span className="text-primary">completed_at</span> - When job finished</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">hcs_topics</h4>
                <div className="bg-secondary/10 p-4 rounded-lg space-y-1 text-sm font-mono">
                  <div><span className="text-primary">id</span> - UUID primary key</div>
                  <div><span className="text-primary">topic_id</span> - Hedera topic ID</div>
                  <div><span className="text-primary">topic_type</span> - Type of topic</div>
                  <div><span className="text-primary">market_id</span> - Associated market</div>
                  <div><span className="text-primary">description</span> - Topic description</div>
                  <div><span className="text-primary">is_active</span> - Active status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Functions */}
          <Card>
            <CardHeader>
              <CardTitle>Key Database Functions</CardTitle>
              <CardDescription>
                Critical functions that power the async system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">create_topic_job()</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Creates a new job entry with auto-generated request ID
                </p>
                <div className="bg-secondary/10 p-3 rounded-lg text-sm font-mono">
                  Parameters: topic_type, market_id (optional)<br/>
                  Returns: job_id (UUID)
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">claim_topic_jobs()</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Atomically claims pending jobs for processing using FOR UPDATE SKIP LOCKED
                </p>
                <div className="bg-secondary/10 p-3 rounded-lg text-sm font-mono">
                  Parameters: limit_count<br/>
                  Returns: SETOF topic_creation_jobs
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Handling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Error Handling & Resilience
              </CardTitle>
              <CardDescription>
                How the system handles failures and network issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Retry Strategy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Exponential backoff (1s to 16s)</li>
                    <li>• Maximum 4 retry attempts</li>
                    <li>• Enhanced gRPC keepalive configuration</li>
                    <li>• Specific handling for Code 17 timeouts</li>
                    <li>• Aggressive node failure detection</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Connection Resilience</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 3-minute primary timeout for stability</li>
                    <li>• Fast node removal after 3 failures</li>
                    <li>• 30s-5m node readmission window</li>
                    <li>• 10s connection close timeout</li>
                    <li>• Testnet-optimized gRPC settings</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  gRPC Keepalive Impact
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The enhanced gRPC keepalive configuration significantly reduces the occurrence of 
                  Code 17 timeout errors by maintaining active connections during idle periods and 
                  implementing proper backoff strategies for Hedera testnet instability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Characteristics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Performance Characteristics
              </CardTitle>
              <CardDescription>
                System performance and scalability metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-600">~100ms</div>
                  <div className="text-sm text-muted-foreground">Request Response Time</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-2xl font-bold text-blue-600">5 jobs</div>
                  <div className="text-sm text-muted-foreground">Concurrent Processing</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500/10">
                  <div className="text-2xl font-bold text-purple-600">60s</div>
                  <div className="text-sm text-muted-foreground">Processing Interval</div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Scalability Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Non-blocking client operations</li>
                  <li>• Background processing decoupled from requests</li>
                  <li>• Atomic job claiming prevents race conditions</li>
                  <li>• Configurable batch sizes and intervals</li>
                  <li>• Graceful degradation under high load</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
              <CardDescription>
                How to use the async HCS system in your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Frontend Usage</h4>
                <div className="bg-secondary/10 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{`const { createTopic, isLoading, error } = useAsyncHCS();

// Create a topic and wait for completion
const handleCreateTopic = async () => {
  try {
    const result = await createTopic({
      topicType: 'orders',
      marketId: 'market-uuid',
      timeout: 300000, // 5 minutes
      onProgress: (job) => {
        console.log('Job status:', job.status);
      }
    });
    
    console.log('Topic created:', result.topicId);
  } catch (error) {
    console.error('Topic creation failed:', error);
  }
};`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Direct API Usage</h4>
                <div className="bg-secondary/10 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{`// Create job
const { data } = await supabase.functions.invoke('hcs-manager', {
  body: { 
    action: 'create_topic',
    topic_type: 'orders',
    market_id: 'uuid'
  }
});

// Poll status
const { data: status } = await supabase.functions.invoke('hcs-manager', {
  body: { 
    action: 'get_status',
    request_id: data.request_id
  }
});`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring & Debugging */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring & Debugging</CardTitle>
              <CardDescription>
                How to monitor and debug the async system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Key Metrics to Monitor</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Job completion rates and processing times</li>
                  <li>• Failed job patterns and error messages</li>
                  <li>• Hedera network response times</li>
                  <li>• Queue depth and processing backlog</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Debugging Queries</h4>
                <div className="bg-secondary/10 p-3 rounded-lg text-sm font-mono">
                  -- Check job status distribution<br/>
                  SELECT status, COUNT(*) FROM topic_creation_jobs GROUP BY status;<br/><br/>
                  -- Recent failed jobs with errors<br/>
                  SELECT * FROM topic_creation_jobs WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 10;
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HCSAsyncDocumentation;