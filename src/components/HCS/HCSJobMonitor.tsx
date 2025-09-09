import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAsyncHCS } from '@/hooks/useAsyncHCS';
import { formatDistanceToNow } from 'date-fns';

interface HCSJobMonitorProps {
  showHistory?: boolean;
  compact?: boolean;
}

export function HCSJobMonitor({ showHistory = true, compact = false }: HCSJobMonitorProps) {
  const { activeJobs, getJobHistory, pollJobStatus } = useAsyncHCS();
  const jobHistory = getJobHistory();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-success border-success">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateProgress = (job: any) => {
    if (job.status === 'success') return 100;
    if (job.status === 'failed') return 100;
    if (job.status === 'processing') return 50;
    return 0;
  };

  const handleRefreshJob = async (jobId: string) => {
    await pollJobStatus(jobId);
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">HCS Jobs</CardTitle>
            <Badge variant="outline">{activeJobs.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active jobs</p>
          ) : (
            <div className="space-y-2">
              {activeJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="font-medium text-sm">{job.topic_type}</span>
                    {job.market_id && (
                      <Badge variant="outline" className="text-xs">
                        Market: {job.market_id.slice(0, 8)}...
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Jobs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5" />
            Active Jobs
          </CardTitle>
          <CardDescription>
            Currently processing topic creation jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active jobs</p>
              <p className="text-sm text-muted-foreground">
                Topic creation jobs will appear here when queued
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-semibold">{job.topic_type} Topic</h4>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(job.created_at))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshJob(job.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {getStatusBadge(job.status)}
                    </div>
                  </div>

                  <Progress value={calculateProgress(job)} className="mb-3" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Job ID:</span>
                      <p className="font-mono">{job.id.slice(0, 8)}...</p>
                    </div>
                    {job.market_id && (
                      <div>
                        <span className="text-muted-foreground">Market ID:</span>
                        <p className="font-mono">{job.market_id.slice(0, 8)}...</p>
                      </div>
                    )}
                    {job.topic_id && (
                      <div>
                        <span className="text-muted-foreground">Topic ID:</span>
                        <p className="font-mono">{job.topic_id}</p>
                      </div>
                    )}
                    {job.duration && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p>{job.duration}ms</p>
                      </div>
                    )}
                  </div>

                  {job.error && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{job.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job History Section */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              Recent topic creation jobs and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobHistory.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No job history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobHistory.slice(0, 10).map((job, index) => (
                  <div key={job.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.topic_type} Topic</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(job.created_at))} ago
                            {job.duration && ` • ${job.duration}ms`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.topic_id && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {job.topic_id}
                          </Badge>
                        )}
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                    {index < jobHistory.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}