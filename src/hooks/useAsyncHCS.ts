import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopicJob {
  id: string;
  topic_type: string;
  market_id?: string;
  status: 'pending' | 'processing' | 'submitted' | 'confirmed' | 'failed';
  topic_id?: string;
  transaction_id?: string;
  submitted_at?: string;
  mirror_node_checked_at?: string;
  mirror_node_retry_count?: number;
  error?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  claimed_at?: string;
  retry_count?: number;
  max_retries?: number;
  worker_id?: string;
}

interface CreateTopicOptions {
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes';
  marketId?: string;
  timeout?: number;
  onProgress?: (status: TopicJob) => void;
}

interface UseAsyncHCSReturn {
  createTopic: (options: CreateTopicOptions) => Promise<{ jobId: string; topicId?: string }>;
  activeJobs: TopicJob[];
  jobHistory: TopicJob[];
  clearAllJobs: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAsyncHCS(): UseAsyncHCSReturn {
  const [activeJobs, setActiveJobs] = useState<TopicJob[]>([]);
  const [jobHistory, setJobHistory] = useState<TopicJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initial load of jobs
  useEffect(() => {
    const fetchJobs = async () => {
      const { data: jobs, error } = await supabase
        .from('topic_creation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching jobs:', error);
        setError(error.message);
        return;
      }

      const typedJobs = jobs as TopicJob[];
      setJobHistory(typedJobs);
      
      // Set activeJobs to jobs that are still in progress
      setActiveJobs(typedJobs.filter(job => 
        job.status === 'pending' || 
        job.status === 'processing' || 
        job.status === 'submitted'
      ));
    };

    fetchJobs();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log('Setting up real-time subscription for topic_creation_jobs...');
    
    const channel = supabase
      .channel('jobs-changes', {
        config: {
          broadcast: { self: true },
          presence: { key: 'jobs' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_creation_jobs',
        },
        (payload) => {
          console.log('🔔 Realtime job update received:', payload);
          
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            console.log('DELETE event for job:', deletedId);
            setJobHistory((prev) => prev.filter((j) => j.id !== deletedId));
            setActiveJobs((prev) => prev.filter((j) => j.id !== deletedId));
            return;
          }

          const newJob = payload.new as TopicJob;
          if (!newJob) {
            console.log('No job data in payload:', payload);
            return;
          }

          console.log('Processing job update:', newJob.id, newJob.status);

          // Update job history
          setJobHistory((prev) => {
            const filtered = prev.filter((j) => j.id !== newJob.id);
            const updated = [newJob, ...filtered];
            console.log('Updated job history, now has', updated.length, 'jobs');
            return updated.slice(0, 50); // keep last 50
          });

          // Update active jobs
          setActiveJobs((prev) => {
            const filtered = prev.filter((j) => j.id !== newJob.id);
            if (['pending', 'processing', 'submitted'].includes(newJob.status)) {
              console.log('Adding job to active jobs:', newJob.id);
              return [newJob, ...filtered];
            }
            console.log('Job not active anymore:', newJob.id, newJob.status);
            return filtered;
          });
        }
      )
      .subscribe((status, err) => {
        console.log('Real-time subscription status:', status);
        if (err) {
          console.error('Real-time subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully connected to real-time updates');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Real-time connection timed out, but will auto-retry');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time connection closed, will attempt reconnect');
        }
      });

    return () => {
      console.log('Removing real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  const createTopic = useCallback(async (options: CreateTopicOptions) => {
    console.log('Creating topic job with options:', options);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('create_topic_job', {
        p_topic_type: options.topicType,
        p_market_id: options.marketId || null,
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('Topic job created with ID:', data);

      toast({
        title: "Topic Creation Started",
        description: "Your job has been queued and will be processed shortly.",
      });

      return { jobId: data };
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error creating topic job:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Failed to Create Topic Job",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearAllJobs = useCallback(async () => {
    try {
      // Clear all jobs that are older than 1 minute to prevent clearing active ones
      const { error } = await supabase
        .from('topic_creation_jobs')
        .update({
          status: 'failed',
          error: 'Manually cleared by user',
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .in('status', ['pending', 'processing', 'failed'])
        .lt('created_at', new Date(Date.now() - 60000).toISOString());

      if (error) throw error;
      
      toast({
        title: "Jobs Cleared",
        description: "All job history and logs have been cleared.",
      });
    } catch (err) {
      toast({
        title: "Failed to Clear Jobs",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    createTopic,
    activeJobs,
    jobHistory,
    clearAllJobs,
    isLoading,
    error,
  };
}