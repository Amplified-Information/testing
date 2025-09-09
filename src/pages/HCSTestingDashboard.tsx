import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HCSTestRunner } from '@/components/HCS/HCSTestRunner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Target, Zap, CheckCircle } from 'lucide-react';

export default function HCSTestingDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          HCS Topics Testing Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Comprehensive testing and validation suite for Hedera Consensus Service (HCS) topic creation 
          and management within our CLOB trading architecture.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Objectives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Phases</div>
            <p className="text-xs text-muted-foreground">
              Connection test + systematic HCS validation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Markets</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Markets</div>
            <p className="text-xs text-muted-foreground">
              Sports, Technology, and Politics categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Topics</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~20+ Topics</div>
            <p className="text-xs text-muted-foreground">
              Individual + market-specific orders & batches topics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Plan Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            HCS Architecture & Testing Strategy
          </CardTitle>
          <CardDescription>
            Understanding the HCS hybrid architecture and our testing approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>HCS Hybrid Architecture:</strong> Topics and metadata are stored on-chain for consensus, 
              while message contents are stored off-chain on mirror nodes for high throughput and cost efficiency.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">On-Chain Benefits</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Topic creation with admin/submit keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Consensus timestamps for fair ordering</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Immutable sequence numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Running hash for integrity</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Off-Chain Benefits</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>High throughput message storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Cost-effective large message handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Rich query APIs via mirror nodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">✓</Badge>
                  <span>Message chunking for large orders</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Four-Phase Testing Strategy</h4>
            <div className="grid gap-4">
              <div className="p-4 rounded-lg border bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">Phase 1: Basic Topic Setup & Testing</h5>
                  <Badge>Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Create individual test topics and set up market-specific topics for 3 selected markets.
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Create 3 individual test topics (orders, batches, oracle)</li>
                  <li>• Setup topics for NBA Championship, Tech Market Cap, and Presidential Nomination markets</li>
                  <li>• Validate topic creation and database storage</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">Phase 2: Comprehensive Market Initialization</h5>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Bulk topic creation for all remaining markets and organization validation.
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Initialize topics for all 7+ remaining active markets</li>
                  <li>• Validate topic organization and querying</li>
                  <li>• Monitor creation process performance</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">Phase 3: Functional Testing & Integration</h5>
                  <Badge variant="outline">Future</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Test CLOB integration, real-time subscriptions, and error handling.
                </p>
                <ul className="text-xs space-y-1">
                  <li>• Test order submission via CLOB relayer</li>
                  <li>• Validate real-time topic subscriptions</li>
                  <li>• Test message chunking and reconstruction</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">Phase 4: Performance & Monitoring</h5>
                  <Badge variant="outline">Future</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Performance testing, monitoring setup, and cost analysis.
                </p>
                <ul className="text-xs space-y-1">
                  <li>• High-volume message throughput testing</li>
                  <li>• Latency measurement and optimization</li>
                  <li>• Cost analysis and monitoring setup</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Runner Component */}
      <HCSTestRunner />
    </div>
  );
}