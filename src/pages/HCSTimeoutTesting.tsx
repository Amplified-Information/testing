import React, { useState } from 'react';
import { ArrowLeft, Timer, Activity, TestTube, Database, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { TimeoutTestPanel } from '@/components/HCS/TimeoutTestPanel';
import { HCSJobMonitor } from '@/components/HCS/HCSJobMonitor';
import { HederaConnectivityTest } from '@/components/HCS/HederaConnectivityTest';

export default function HCSTimeoutTesting() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dev-notes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dev Notes
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HCS Timeout Testing Suite</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Test and monitor the enhanced Hedera Consensus Service timeout configurations
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <Timer className="h-3 w-3 mr-1" />
              Timeout Testing
            </Badge>
          </div>
        </div>

        {/* Alert Banner */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Network Connectivity Issue Detected</h3>
                <p className="text-sm text-orange-700 mt-1">
                  All HCS topic creations are timing out after ~63 seconds. Run the connectivity test below to diagnose the root cause.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Testing Tabs */}
        <Tabs defaultValue="connectivity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connectivity" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Network Connectivity
            </TabsTrigger>
            <TabsTrigger value="timeout" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Timeout Testing
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Job Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connectivity" className="space-y-6">
            <HederaConnectivityTest />
          </TabsContent>

          <TabsContent value="timeout" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Main Testing Panel */}
              <div className="lg:col-span-3">
                <TimeoutTestPanel />
              </div>

              {/* Information Sidebar */}
              <div className="space-y-6">
                {/* Enhanced Configurations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4" />
                      Enhanced Config
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div>
                      <p className="font-medium">Request Timeout</p>
                      <p className="text-muted-foreground">20s (was 8s)</p>
                    </div>
                    <div>
                      <p className="font-medium">gRPC Deadline</p>
                      <p className="text-muted-foreground">15s (was 6s)</p>
                    </div>
                    <div>
                      <p className="font-medium">Transaction Valid</p>
                      <p className="text-muted-foreground">90s (was 30s)</p>
                    </div>
                    <div>
                      <p className="font-medium">Max Retries</p>
                      <p className="text-muted-foreground">8 attempts (was 4)</p>
                    </div>
                    <div>
                      <p className="font-medium">Node Readmit</p>
                      <p className="text-muted-foreground">2min (was 1min)</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Database className="h-4 w-4" />
                      Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                    >
                      <a 
                        href="https://supabase.com/dashboard/project/bfenuvdwsgzglhhjbrql/functions/process-topic-jobs/logs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Edge Function Logs
                      </a>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                    >
                      <a 
                        href="https://supabase.com/dashboard/project/bfenuvdwsgzglhhjbrql/editor" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Database Editor
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Test Expectations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TestTube className="h-4 w-4" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div>
                      <p className="font-medium text-green-600">&gt;80% Success Rate</p>
                      <p className="text-muted-foreground">Jobs complete successfully</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">&lt;30s Avg Duration</p>
                      <p className="text-muted-foreground">Fast topic creation</p>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600">&lt;3 Timeouts</p>
                      <p className="text-muted-foreground">Per 10 test batch</p>
                    </div>
                    <div>
                      <p className="font-medium text-purple-600">Auto-Retry</p>
                      <p className="text-muted-foreground">Up to 8 attempts</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Meanings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Job Status Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>pending → connecting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>submitting → submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>completed (success)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>failed (retry/timeout)</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <HCSJobMonitor showHistory={true} compact={false} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}