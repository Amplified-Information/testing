import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MirrorNodeTopic {
  topic_id: string;
  created_timestamp: string;
  memo?: string;
  admin_key?: {
    key: string;
  };
  submit_key?: {
    key: string;
  };
}

interface MirrorNodeTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  result: string;
  entity_id?: string;
  memo_base64?: string;
  name: string;
}

export function MirrorNodePoller() {
  const [topics, setTopics] = useState<MirrorNodeTopic[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<MirrorNodeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const pollMirrorNode = async () => {
    setIsLoading(true);
    try {
      // Query recent topic creation transactions
      const transactionsResponse = await fetch(
        'https://testnet.mirrornode.hedera.com/api/v1/transactions?transactiontype=CONSENSUSCREATETOPIC&limit=10&order=desc'
      );
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.transactions || []);
      }

      // Query topics directly
      const topicsResponse = await fetch(
        'https://testnet.mirrornode.hedera.com/api/v1/topics?limit=20&order=desc'
      );
      
      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json();
        setTopics(topicsData.topics || []);
      }

      toast({
        title: "Mirror Node Poll Complete",
        description: `Found ${recentTransactions.length} recent transactions and ${topics.length} topics`,
      });
    } catch (error) {
      console.error('Mirror node poll error:', error);
      toast({
        title: "Mirror Node Error",
        description: "Failed to poll mirror node",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const seconds = parseFloat(timestamp);
    return new Date(seconds * 1000).toLocaleString();
  };

  const decodeMemo = (memoBase64?: string) => {
    if (!memoBase64) return 'No memo';
    try {
      return atob(memoBase64);
    } catch {
      return memoBase64;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hedera Mirror Node Polling</h3>
          <p className="text-sm text-muted-foreground">
            Check recent topic creation activity on Hedera testnet
          </p>
        </div>
        <Button onClick={pollMirrorNode} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Poll Mirror Node
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Topic Creation Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Topic Transactions
            </CardTitle>
            <CardDescription>
              Latest CONSENSUSCREATETOPIC transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">No recent transactions found</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.transaction_id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={tx.result === 'SUCCESS' ? 'default' : 'destructive'}>
                        {tx.result === 'SUCCESS' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {tx.result}
                      </Badge>
                      {tx.entity_id && (
                        <Badge variant="outline">
                          Topic: {tx.entity_id}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-medium">TX ID:</span> {tx.transaction_id}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {formatTimestamp(tx.consensus_timestamp)}
                      </div>
                      {tx.memo_base64 && (
                        <div>
                          <span className="font-medium">Memo:</span> {decodeMemo(tx.memo_base64)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Topics
            </CardTitle>
            <CardDescription>
              Latest created HCS topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topics.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">No topics found</p>
              ) : (
                topics.map((topic) => (
                  <div key={topic.topic_id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {topic.topic_id}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-medium">Created:</span> {formatTimestamp(topic.created_timestamp)}
                      </div>
                      {topic.memo && (
                        <div>
                          <span className="font-medium">Memo:</span> {topic.memo}
                        </div>
                      )}
                      {topic.admin_key && (
                        <div>
                          <span className="font-medium">Admin Key:</span> Yes
                        </div>
                      )}
                      {topic.submit_key && (
                        <div>
                          <span className="font-medium">Submit Key:</span> Yes
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}