import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HCSRequest {
  id: number;
  memo: string | null;
  status: string;
  topic_id: string | null;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  mirror_confirmed_at: string | null;
}

interface UseSimpleHCSReturn {
  createTopic: (memo?: string, topicType?: string) => Promise<HCSRequest | null>;
  isLoading: boolean;
  error: string | null;
}

export const useSimpleHCS = (): UseSimpleHCSReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTopic = async (memo?: string, topicType = 'general'): Promise<HCSRequest | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Creating HCS topic with new approach...');
      
      const { data, error: functionError } = await supabase.functions.invoke('request-hcs-topic', {
        body: { memo, topicType }
      });

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(functionError.message || 'Failed to create topic');
      }

      if (!data?.success) {
        console.error('❌ Request failed:', data?.error);
        throw new Error(data?.error || 'Topic creation failed');
      }

      console.log('✅ Topic created successfully:', data);
      
      // Fetch the created request
      const { data: request, error: fetchError } = await supabase
        .from('hcs_requests')
        .select('*')
        .eq('id', data.requestId)
        .single();

      if (fetchError || !request) {
        console.error('❌ Failed to fetch created request:', fetchError);
        throw new Error('Failed to fetch created topic request');
      }

      toast.success(`Topic created successfully! Topic ID: ${data.topicId}`);
      return request;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Create topic error:', err);
      setError(errorMessage);
      toast.error(`Failed to create topic: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTopic,
    isLoading,
    error
  };
};