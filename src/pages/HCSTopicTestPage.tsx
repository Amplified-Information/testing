import { ArrowLeft, Database, MessageSquare, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import HCSTopicTest from '@/components/HCS/HCSTopicTest';

export default function HCSTopicTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dev-notes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dev Notes
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HCS Topic Test</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Test Hedera Consensus Service topic creation and messaging
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Live Testing
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Test Interface */}
          <div className="lg:col-span-2">
            <HCSTopicTest />
          </div>

          {/* Methodology & Info */}
          <div className="space-y-6">
            {/* Test Methodology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Test Methodology
                </CardTitle>
                <CardDescription>
                  Step-by-step HCS validation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-sm">Prerequisites</p>
                      <p className="text-xs text-muted-foreground">Account credentials and network setup</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-sm">Initialize Client</p>
                      <p className="text-xs text-muted-foreground">Connect to testnet with operator</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create Topic</p>
                      <p className="text-xs text-muted-foreground">Generate new HCS topic</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-sm">Submit Message</p>
                      <p className="text-xs text-muted-foreground">Send test message to topic</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Network</p>
                    <p className="text-muted-foreground">Hedera Testnet</p>
                  </div>
                  <div>
                    <p className="font-medium">SDK Version</p>
                    <p className="text-muted-foreground">@hashgraph/sdk ^2.72.0</p>
                  </div>
                  <div>
                    <p className="font-medium">Auto-Renewal</p>
                    <p className="text-muted-foreground">3600 seconds (1 hour)</p>
                  </div>
                  <div>
                    <p className="font-medium">Credentials</p>
                    <p className="text-muted-foreground">Stored in Supabase secrets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Key Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>Message ordering</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>Immutable consensus</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>Low latency</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}