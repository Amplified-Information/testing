import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupStats {
  stuck_jobs_cleaned: number;
  old_failed_jobs_cleaned: number;
  requeued_jobs: number;
  total_pending: number;
  total_failed: number;
  health_status: 'healthy' | 'degraded' | 'critical';
  recommendations: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting HCS system cleanup and health monitoring...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const stats: CleanupStats = {
      stuck_jobs_cleaned: 0,
      old_failed_jobs_cleaned: 0,
      requeued_jobs: 0,
      total_pending: 0,
      total_failed: 0,
      health_status: 'healthy',
      recommendations: []
    };

    // 1. Clean up jobs stuck in 'submitting' or 'processing' for > 2 hours
    console.log('🔧 Cleaning up stuck jobs...');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: stuckJobs, error: stuckError } = await supabase
      .from('topic_creation_jobs')
      .select('id, status, created_at, retry_count, max_retries, topic_type')
      .in('status', ['submitting', 'processing', 'connecting'])
      .lt('created_at', twoHoursAgo);

    if (stuckError) {
      console.error('❌ Error finding stuck jobs:', stuckError);
    } else if (stuckJobs && stuckJobs.length > 0) {
      console.log(`🚨 Found ${stuckJobs.length} stuck jobs older than 2 hours`);
      
      for (const job of stuckJobs) {
        const canRetry = (job.retry_count || 0) < (job.max_retries || 5);
        
        if (canRetry) {
          // Requeue for retry with exponential backoff
          const backoffMinutes = Math.pow(2, job.retry_count || 0); // 1, 2, 4, 8, 16 minutes
          const scheduledFor = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
          
          await supabase
            .from('topic_creation_jobs')
            .update({
              status: 'pending',
              retry_count: (job.retry_count || 0) + 1,
              error: `Cleaned up stuck job - requeued with ${backoffMinutes}min backoff`,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          stats.requeued_jobs++;
          console.log(`🔁 Requeued stuck job ${job.id} with ${backoffMinutes}min backoff`);
        } else {
          // Mark as failed
          await supabase
            .from('topic_creation_jobs')
            .update({
              status: 'failed',
              error: 'Job abandoned after 2+ hours stuck in processing',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          stats.stuck_jobs_cleaned++;
          console.log(`❌ Marked stuck job ${job.id} as failed (max retries exceeded)`);
        }
      }
    }

    // 2. Clean up old failed jobs (older than 7 days)
    console.log('🗑️ Cleaning up old failed jobs...');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { count: oldFailedCount, error: cleanupError } = await supabase
      .from('topic_creation_jobs')
      .delete({ count: 'exact' })
      .eq('status', 'failed')
      .lt('created_at', sevenDaysAgo);

    if (cleanupError) {
      console.error('❌ Error cleaning old failed jobs:', cleanupError);
    } else {
      stats.old_failed_jobs_cleaned = oldFailedCount || 0;
      console.log(`🗑️ Cleaned up ${stats.old_failed_jobs_cleaned} old failed jobs`);
    }

    // 3. Get current system health stats
    console.log('📊 Analyzing system health...');
    const { data: statusStats, error: statsError } = await supabase
      .from('topic_creation_jobs')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    if (!statsError && statusStats) {
      const statusCounts = statusStats.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.total_pending = statusCounts.pending || 0;
      stats.total_failed = statusCounts.failed || 0;
      
      const totalJobs = statusStats.length;
      const successRate = totalJobs > 0 ? ((statusCounts.confirmed || 0) / totalJobs) : 1;
      const failureRate = totalJobs > 0 ? ((statusCounts.failed || 0) / totalJobs) : 0;

      // Determine health status
      if (failureRate > 0.5) {
        stats.health_status = 'critical';
        stats.recommendations.push('High failure rate detected - check Hedera network connectivity');
      } else if (failureRate > 0.2 || stats.total_pending > 20) {
        stats.health_status = 'degraded';
        stats.recommendations.push('Elevated failures or queue backlog - monitor closely');
      }

      if (stats.total_pending > 50) {
        stats.recommendations.push('Large queue backlog - consider scaling workers');
      }

      console.log('📈 Health metrics:', {
        totalJobs,
        successRate: `${(successRate * 100).toFixed(1)}%`,
        failureRate: `${(failureRate * 100).toFixed(1)}%`,
        pendingJobs: stats.total_pending,
        healthStatus: stats.health_status
      });
    }

    // 4. Check for very old HCS requests that might need cleanup
    const { data: oldRequests, error: oldRequestsError } = await supabase
      .from('hcs_requests')
      .select('id, status, created_at')
      .in('status', ['pending', 'created'])
      .lt('created_at', twoHoursAgo);

    if (!oldRequestsError && oldRequests && oldRequests.length > 0) {
      console.log(`🧹 Found ${oldRequests.length} old HCS requests to clean up`);
      
      // Mark old requests as failed
      await supabase
        .from('hcs_requests')
        .update({
          status: 'failed',
          error_message: 'Request abandoned after 2+ hours',
          updated_at: new Date().toISOString()
        })
        .in('id', oldRequests.map(r => r.id));
      
      stats.recommendations.push(`Cleaned up ${oldRequests.length} old HCS requests`);
    }

    // 5. Trigger worker if there are pending jobs
    if (stats.total_pending > 0) {
      console.log(`🔄 Triggering worker for ${stats.total_pending} pending jobs...`);
      
      try {
        await supabase.functions.invoke('process-topic-jobs', {
          body: { trigger: 'cleanup_monitor', pending_count: stats.total_pending }
        });
        stats.recommendations.push('Triggered worker for pending jobs');
      } catch (workerError) {
        console.error('❌ Failed to trigger worker:', workerError);
        stats.recommendations.push('Failed to trigger worker - manual intervention may be needed');
      }
    }

    console.log('✅ Cleanup and monitoring completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stats,
        message: `Cleanup completed - ${stats.health_status} system health`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Cleanup and monitoring failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});