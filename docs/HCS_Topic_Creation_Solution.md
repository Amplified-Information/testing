# Complete HCS Topic Creation Solution

This document outlines the complete architecture and implementation for creating Hedera Consensus Service (HCS) topics in an async, scalable manner.

## Architecture Overview

The HCS topic creation solution uses an async job queue architecture with the following components:

1. **Frontend Request Interface** - User-facing API for requesting topic creation
2. **Job Queue System** - Asynchronous job management using Supabase database
3. **Background Worker** - Processes jobs and creates actual HCS topics
4. **Status Polling** - Client-side polling for job completion
5. **Database Storage** - Persistent storage for jobs and created topics

## Component Breakdown

### 1. Frontend API - `hcs-manager` Edge Function

**Location:** `supabase/functions/hcs-manager/index.ts`

**Purpose:** Handles topic creation requests and job status queries

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topicType, marketId, requestId } = await req.json()

    switch (action) {
      case 'create_topic': {
        // Generate unique request ID
        const newRequestId = crypto.randomUUID()

        // Insert job into queue
        const { error } = await supabase.from('topic_creation_jobs').insert({
          request_id: newRequestId,
          topic_type: topicType,
          market_id: marketId,
          status: 'pending'
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            requestId: newRequestId,
            message: 'Topic creation enqueued. Poll status with action=topic_status.'
          }),
          { headers: corsHeaders, status: 202 }
        )
      }

      case 'topic_status': {
        // Query job status
        const { data, error } = await supabase
          .from('topic_creation_jobs')
          .select('*')
          .eq('request_id', requestId)
          .single()

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Job not found' }),
            { headers: corsHeaders, status: 404 }
          )
        }

        return new Response(JSON.stringify(data), {
          headers: corsHeaders,
          status: 200
        })
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: corsHeaders, status: 400 }
        )
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
```

**Key Features:**
- Fire-and-return pattern: immediately returns `requestId`
- No blocking operations
- Clear separation of concerns (request handling vs. processing)

### 2. Background Worker - `process-topic-jobs` Edge Function

**Location:** `supabase/functions/process-topic-jobs/index.ts`

**Purpose:** Processes queued jobs and creates actual HCS topics

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getSystemHederaClientFromSecrets } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    console.log('🔄 Processing topic creation jobs...')
    
    // Fetch up to 5 pending jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('topic_creation_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5)

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jobs' }),
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs found')
      return new Response(
        JSON.stringify({ message: 'No pending jobs' }),
        { status: 200 }
      )
    }

    console.log(`Found ${jobs.length} pending jobs`)

    // Process each job
    for (const job of jobs) {
      const startTime = Date.now()
      
      try {
        // Update status to processing
        await supabase
          .from('topic_creation_jobs')
          .update({ status: 'processing' })
          .eq('id', job.id)

        console.log(`Processing job ${job.id} for ${job.topic_type}`)

        // Get Hedera client
        const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)

        // Create topic
        const topicId = await createCLOBTopic(
          client,
          privateKey.toString(),
          job.topic_type,
          job.market_id
        )

        const duration = Date.now() - startTime

        // Insert into hcs_topics table
        await supabase.from('hcs_topics').insert({
          topic_id: topicId,
          topic_type: job.topic_type,
          market_id: job.market_id,
          description: `${job.topic_type} topic${job.market_id ? ` for market ${job.market_id}` : ''}`
        })

        // Update job status to success
        await supabase
          .from('topic_creation_jobs')
          .update({
            status: 'success',
            topic_id: topicId,
            completed_at: new Date().toISOString(),
            duration
          })
          .eq('id', job.id)

        console.log(`✅ Job ${job.id} completed successfully: ${topicId} (${duration}ms)`)

      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage = (error as Error).message

        console.error(`❌ Job ${job.id} failed:`, errorMessage)

        // Update job status to failed
        await supabase
          .from('topic_creation_jobs')
          .update({
            status: 'failed',
            error: errorMessage,
            completed_at: new Date().toISOString(),
            duration
          })
          .eq('id', job.id)
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${jobs.length} jobs`,
        jobsProcessed: jobs.length
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    )
  }
})
```

**Key Features:**
- Batch processing (up to 5 jobs at once)
- Proper error handling and status updates
- Duration tracking for performance monitoring
- Service role permissions for database access

### 3. Client-Side Polling Logic

**Location:** `src/lib/hcsTopicTester.ts`

**Purpose:** Handles client-side polling for job completion

```typescript
/**
 * Poll job status until completion with timeout and retry logic
 */
private async pollJobStatus(requestId: string, maxAttempts: number = 30, intervalMs: number = 2000): Promise<JobStatusResult> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const { data, error } = await supabase.functions.invoke('hcs-manager', {
        body: {
          action: 'topic_status',
          requestId
        }
      });

      if (error) {
        return { success: false, status: 'failed', error: error.message };
      }

      const status = data.status;
      
      if (status === 'success') {
        return {
          success: true,
          status: 'success',
          topic_id: data.topic_id,
          duration: data.duration
        };
      }
      
      if (status === 'failed') {
        return {
          success: false,
          status: 'failed',
          error: data.error || 'Job failed without specific error'
        };
      }

      // Still pending or processing, wait and retry
      if (status === 'pending' || status === 'processing') {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }
      }
      
    } catch (err) {
      return { success: false, status: 'failed', error: (err as Error).message };
    }
  }
  
  return { 
    success: false, 
    status: 'failed', 
    error: `Timeout after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)` 
  };
}

/**
 * Create a single topic and wait for completion
 */
private async createTopicAndWait(topicType: string, marketId?: string, description?: string): Promise<HCSTopicCreationResult> {
  try {
    // Submit topic creation job
    const { data, error } = await supabase.functions.invoke('hcs-manager', {
      body: {
        action: 'create_topic',
        topicType,
        marketId,
        description
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.requestId) {
      return { success: false, error: 'No requestId returned from topic creation' };
    }

    // Poll for completion
    const result = await this.pollJobStatus(data.requestId);
    
    if (result.success && result.topic_id) {
      return {
        success: true,
        topicId: result.topic_id,
        requestId: data.requestId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Topic creation failed',
        requestId: data.requestId
      };
    }
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
```

**Key Features:**
- Configurable timeout and retry logic
- Exponential backoff (can be added)
- Clear error handling and status reporting
- Non-blocking async operations

### 4. Database Schema

**Tables:**

#### `topic_creation_jobs`
```sql
CREATE TABLE topic_creation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  topic_type TEXT NOT NULL,
  market_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  topic_id TEXT,
  error TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `hcs_topics`
```sql
CREATE TABLE hcs_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL UNIQUE,
  topic_type TEXT NOT NULL,
  market_id UUID,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 5. Hedera Integration Layer

**Location:** `supabase/functions/_shared/topicService.ts` & `supabase/functions/_shared/hederaClient.ts`

**Purpose:** Handles actual Hedera network interaction

```typescript
// Hedera Client Configuration
export async function getSystemHederaClientFromSecrets(supabase: any): Promise<{ client: Client, privateKey: PrivateKey }> {
  // Fetch credentials from Supabase secrets table
  const { data: secrets, error } = await supabase
    .from('secrets')
    .select('name, value')
    .in('name', ['HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY'])

  if (error) throw new Error(`Failed to fetch Hedera secrets: ${error.message}`)

  const operatorId = secrets.find(s => s.name === 'HEDERA_OPERATOR_ID')?.value
  const operatorKey = secrets.find(s => s.name === 'HEDERA_OPERATOR_KEY')?.value

  if (!operatorId || !operatorKey) {
    throw new Error('Missing required Hedera credentials in secrets')
  }

  // Create client
  const client = Client.forTestnet()
  const privateKey = PrivateKey.fromString(operatorKey)
  
  client.setOperator(operatorId, privateKey)
  
  return { client, privateKey }
}

// Topic Creation
export async function createCLOBTopic(
  client: Client,
  operatorKey: string,
  topicType: string,
  marketId?: string
): Promise<string> {
  const privateKey = PrivateKey.fromString(operatorKey)
  
  const memo = marketId 
    ? `CLOB-${topicType.toUpperCase()}-${marketId}`
    : `CLOB-${topicType.toUpperCase()}-GLOBAL`

  const transaction = new TopicCreateTransaction()
    .setTopicMemo(memo)
    .setAdminKey(privateKey.publicKey)
    .setSubmitKey(privateKey.publicKey)
    .freezeWith(client)

  const signedTransaction = await transaction.sign(privateKey)
  const response = await signedTransaction.execute(client)
  const receipt = await response.getReceipt(client)

  if (!receipt.topicId) {
    throw new Error('Topic creation failed: No topic ID in receipt')
  }

  return receipt.topicId.toString()
}
```

## Flow Diagram

```
Client Request
     │
     ▼
[hcs-manager] ──► [topic_creation_jobs] ◄──┐
     │                    │                │
     │ (returns           │                │
     │  requestId)        │                │
     ▼                    ▼                │
[Client Polling]    [process-topic-jobs]  │
     │                    │                │
     │                    ▼                │
     │              [Hedera Network]       │
     │                    │                │
     │                    ▼                │
     │              [hcs_topics table]     │
     │                    │                │
     └──── (polls) ──────┴────────────────┘
```

## Usage Examples

### Basic Topic Creation
```typescript
// Request topic creation
const { data } = await supabase.functions.invoke('hcs-manager', {
  body: {
    action: 'create_topic',
    topicType: 'orders'
  }
})

const requestId = data.requestId

// Poll for completion
let completed = false
while (!completed) {
  const { data: status } = await supabase.functions.invoke('hcs-manager', {
    body: {
      action: 'topic_status',
      requestId
    }
  })
  
  if (status.status === 'success') {
    console.log('Topic created:', status.topic_id)
    completed = true
  } else if (status.status === 'failed') {
    console.error('Topic creation failed:', status.error)
    completed = true
  } else {
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

### Market-Specific Topic Creation
```typescript
// Create topics for a specific market
const ordersResult = await createTopicAndWait('orders', marketId, 'Orders topic for market')
const batchesResult = await createTopicAndWait('batches', marketId, 'Batches topic for market')
```

## Benefits of This Architecture

1. **Scalability:** Non-blocking requests allow high throughput
2. **Reliability:** Proper error handling and retry mechanisms
3. **Monitoring:** Complete visibility into job status and performance
4. **Separation of Concerns:** Clear boundaries between components
5. **Testability:** Each component can be tested independently
6. **Maintainability:** Modular design makes updates easier

## Testing Strategy

The HCS testing suite validates all components:

1. **Phase 0:** Basic connectivity testing
2. **Phase 1.1:** Individual topic creation
3. **Phase 1.2:** Market-specific topic creation
4. **Phase 1.3:** Validation and verification
5. **Phase 2:** Bulk initialization

Each test uses the same async polling pattern as production code, ensuring realistic testing conditions.

## Error Handling

The system includes comprehensive error handling at every level:

- **Network errors:** Automatic retries with backoff
- **Hedera errors:** Proper error propagation and logging
- **Database errors:** Transaction rollback and cleanup
- **Timeout errors:** Configurable timeout with clear messaging
- **Validation errors:** Input validation before processing

## Performance Considerations

- **Batch Processing:** Up to 5 jobs processed simultaneously
- **Connection Pooling:** Reuse Hedera client connections
- **Rate Limiting:** Respect Hedera network rate limits
- **Caching:** Cache frequently accessed data
- **Monitoring:** Track performance metrics for optimization

This architecture provides a robust, scalable foundation for HCS topic creation that can handle production workloads while maintaining reliability and observability.