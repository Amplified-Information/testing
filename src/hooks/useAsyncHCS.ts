import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopicJob {
  id: string;
  topic_type: string;
  market_id?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  topic_id?: string;
  error?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  claimed_at?: string;
}

interface CreateTopicOptions {
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes';
  marketId?: string;
  timeout?: number;
  onProgress?: (status: TopicJob) => void;
}

interface UseAsyncHCSReturn {
  createTopic: (options: CreateTopicOptions) => Promise<{ jobId: string; topicId?: string }>;
  pollJobStatus: (jobId: string) => Promise<TopicJob | null>;
  getJobHistory: () => TopicJob[];
  isLoading: boolean;
  error: string | null;
  activeJobs: TopicJob[];
}

export function useAsyncHCS(): UseAsyncHCSReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for active jobs
  const { data: activeJobs = [] } = useQuery({
    queryKey: ['hcs-jobs', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_creation_jobs')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TopicJob[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Query for job history
  const { data: jobHistory = [] } = useQuery({
    queryKey: ['hcs-jobs', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_creation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TopicJob[];
    },
  });

  // Mutation for creating topics
  const createTopicMutation = useMutation({
    mutationFn: async (options: CreateTopicOptions) => {
      const { data, error } = await supabase.rpc('create_topic_job', {
        p_topic_type: options.topicType,
        p_market_id: options.marketId || null,
      });

      if (error) throw error;
      return { jobId: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hcs-jobs'] });
      toast({
        title: "Topic Creation Started",
        description: "Your topic creation job has been queued and will be processed shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Topic Job",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const createTopic = useCallback(async (options: CreateTopicOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const { jobId } = await createTopicMutation.mutateAsync(options);
      
      // If progress callback provided, start polling
      if (options.onProgress) {
        const pollInterval = setInterval(async () => {
          const job = await pollJobStatus(jobId);
          if (job) {
            options.onProgress!(job);
            
            if (job.status === 'success' || job.status === 'failed') {
              clearInterval(pollInterval);
              setIsLoading(false);
            }
          }
        }, 2000);

        // Set timeout if provided
        if (options.timeout) {
          setTimeout(() => {
            clearInterval(pollInterval);
            setIsLoading(false);
          }, options.timeout);
        }
      }

      return { jobId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (!options.onProgress) {
        setIsLoading(false);
      }
    }
  }, [createTopicMutation]);

  const pollJobStatus = useCallback(async (jobId: string): Promise<TopicJob | null> => {
    try {
      const { data, error } = await supabase
        .from('topic_creation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as TopicJob;
    } catch (err) {
      console.error('Failed to poll job status:', err);
      return null;
    }
  }, []);

  const getJobHistory = useCallback(() => {
    return jobHistory;
  }, [jobHistory]);

  return {
    createTopic,
    pollJobStatus,
    getJobHistory,
    isLoading: isLoading || createTopicMutation.isPending,
    error,
    activeJobs,
  };
}