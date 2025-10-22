import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSimpleHCS } from '@/hooks/useSimpleHCS';
import { supabase } from '@/integrations/supabase/client';

interface HCSRequest {
  id: number;
  memo: string | null;
  status: string;
  topic_id: string | null;
  created_at: string;
  error_message: string | null;
  mirror_confirmed_at: string | null;
}

export const SimpleHCSTest: React.FC = () => {
  const [memo, setMemo] = useState('');
  const [requests, setRequests] = useState<HCSRequest[]>([]);
  const { createTopic, isLoading } = useSimpleHCS();

  // Fetch existing requests
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('hcs_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch requests:', error);
    } else {
      setRequests(data || []);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription
    const subscription = supabase
      .channel('hcs_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hcs_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleCreateTopic = async () => {
    const request = await createTopic(memo || undefined);
    if (request) {
      setMemo('');
      fetchRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'created':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Created</Badge>;
      case 'mirror_confirmed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple HCS Topic Creation</CardTitle>
          <CardDescription>
            Test the new simplified approach that gets immediate topic IDs and uses background polling for mirror confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Topic memo (optional)"
              className="flex-1"
            />
            <Button
              onClick={handleCreateTopic}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Topic
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            Live updates of topic creation requests using the new approach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No requests yet. Create a topic to see results here.
              </p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Request #{request.id}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.memo && (
                      <p className="text-sm text-muted-foreground mb-1">{request.memo}</p>
                    )}
                    {request.topic_id && (
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        Topic ID: {request.topic_id}
                      </p>
                    )}
                    {request.error_message && (
                      <p className="text-xs text-destructive mt-1">{request.error_message}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Created: {new Date(request.created_at).toLocaleTimeString()}</div>
                    {request.mirror_confirmed_at && (
                      <div>Confirmed: {new Date(request.mirror_confirmed_at).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};