import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Trash2,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';

interface SystemHealth {
  id: string;
  check_timestamp: string;
  health_status: string;
  total_pending: number;
  total_failed_24h: number;
  success_rate_24h: number;
  stuck_jobs_cleaned: number;
  recommendations: any;
}

interface JobStats {
  status: string;
  count: number;
}

interface CleanupResult {
  success: boolean;
  stats: {
    stuck_jobs_cleaned: number;
    old_failed_jobs_cleaned: number;
    requeued_jobs: number;
    total_pending: number;
    total_failed: number;
    health_status: 'healthy' | 'degraded' | 'critical';
    recommendations: string[];
  };
  message: string;
}

export default function HCSSystemMonitor() {
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [healthHistory, setHealthHistory] = useState<SystemHealth[]>([]);
  const [jobStats, setJobStats] = useState<JobStats[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch current system health and job stats
  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      // Get recent health checks
      const { data: healthData, error: healthError } = await supabase
        .from('hcs_system_health' as any)
        .select('*')
        .order('check_timestamp', { ascending: false })
        .limit(10);

      if (healthError) {
        console.error('Error fetching health data:', healthError);
      } else {
        setHealthHistory((healthData as unknown as SystemHealth[]) || []);
      }

      // Get current job statistics
      const { data: statsData, error: statsError } = await supabase
        .from('topic_creation_jobs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!statsError && statsData) {
        const statusCounts = statsData.reduce((acc, job) => {
          const existing = acc.find(s => s.status === job.status);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ status: job.status, count: 1 });
          }
          return acc;
        }, [] as JobStats[]);
        
        setJobStats(statusCounts);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
      toast.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  // Run cleanup and monitoring
  const runCleanupMonitor = async () => {
    setIsRunningCleanup(true);
    try {
      console.log('🧹 Triggering cleanup monitor...');
      
      const { data, error } = await supabase.functions.invoke('hcs-cleanup-monitor', {
        body: { trigger: 'manual', source: 'ui' }
      });

      if (error) {
        throw error;
      }

      setLastCleanup(data);
      
      // Store health record in database
      if (data.stats) {
        const { error: insertError } = await supabase
          .from('hcs_system_health' as any)
          .insert({
            health_status: data.stats.health_status,
            total_pending: data.stats.total_pending,
            total_failed_24h: data.stats.total_failed,
            success_rate_24h: 0, // Will be calculated in the cleanup function
            stuck_jobs_cleaned: data.stats.stuck_jobs_cleaned,
            recommendations: data.stats.recommendations || []
          });

        if (insertError) {
          console.error('Error storing health record:', insertError);
        }
      }

      // Refresh the status after cleanup
      await fetchSystemStatus();
      
      toast.success(`Cleanup completed - System is ${data.stats?.health_status || 'unknown'}`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setIsRunningCleanup(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800 border-green-300',
      degraded: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      critical: 'bg-red-100 text-red-800 border-red-300'
    };
    
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {getHealthIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'submitting': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const latestHealth = healthHistory[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            HCS System Health Monitor
          </CardTitle>
          <CardDescription>
            Monitor and maintain the health of the HCS topic creation system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Health Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">System Status:</span>
              {latestHealth ? (
                getHealthBadge(latestHealth.health_status)
              ) : (
                <Badge variant="outline">Unknown</Badge>
              )}
              {latestHealth && (
                <span className="text-xs text-muted-foreground">
                  Last checked: {new Date(latestHealth.check_timestamp).toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={runCleanupMonitor}
                disabled={isRunningCleanup}
                size="sm"
              >
                <Trash2 className={`h-4 w-4 ${isRunningCleanup ? 'animate-pulse' : ''}`} />
                {isRunningCleanup ? 'Running Cleanup...' : 'Run Cleanup'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Job Statistics (Last 24h) */}
          <div>
            <h4 className="font-medium mb-2">Job Statistics (Last 24 Hours)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {jobStats.map((stat) => (
                <div key={stat.status} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  {getStatusIcon(stat.status)}
                  <div className="text-sm">
                    <span className="font-medium capitalize">{stat.status}</span>
                    <div className="text-xs text-muted-foreground">{stat.count} jobs</div>
                  </div>
                </div>
              ))}
              {jobStats.length === 0 && !loading && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                  No jobs found in the last 24 hours
                </div>
              )}
            </div>
          </div>

          {/* Latest Cleanup Results */}
          {lastCleanup && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Latest Cleanup Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{lastCleanup.stats.stuck_jobs_cleaned}</div>
                    <div className="text-xs text-muted-foreground">Stuck Jobs Cleaned</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{lastCleanup.stats.requeued_jobs}</div>
                    <div className="text-xs text-muted-foreground">Jobs Requeued</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{lastCleanup.stats.total_pending}</div>
                    <div className="text-xs text-muted-foreground">Pending Jobs</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-lg font-semibold">{lastCleanup.stats.old_failed_jobs_cleaned}</div>
                    <div className="text-xs text-muted-foreground">Old Jobs Cleaned</div>
                  </div>
                </div>

                {lastCleanup.stats.recommendations.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Recommendations:</div>
                      <ul className="text-sm space-y-1">
                        {lastCleanup.stats.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Health History */}
          {healthHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Health History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {healthHistory.map((health) => (
                    <div key={health.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <div className="flex items-center gap-2">
                        {getHealthBadge(health.health_status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(health.check_timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {health.total_pending} pending | {health.stuck_jobs_cleaned} cleaned
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}