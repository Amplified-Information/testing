import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FileText, Code2, BookOpen, ExternalLink, Shield, Wallet, BarChart3, Database, MessageSquare, Clock, CheckCircle, Image } from "lucide-react";

const DevNotesIndex = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Development Notes</h1>
            <p className="text-muted-foreground text-lg">
              Technical documentation and development progress for HashyMarket
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Code2 className="h-12 w-12 mx-auto mb-2 text-primary" />
                <h3 className="text-2xl font-bold">React + TypeScript</h3>
                <p className="text-sm text-muted-foreground">Modern web stack</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <BookOpen className="h-12 w-12 mx-auto mb-2 text-primary" />
                <h3 className="text-2xl font-bold">Hedera Hashgraph</h3>
                <p className="text-sm text-muted-foreground">Blockchain integration</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />
                <h3 className="text-2xl font-bold">Supabase</h3>
                <p className="text-sm text-muted-foreground">Backend & database</p>
              </CardContent>
            </Card>
          </div>

          {/* Documentation Sections */}
          <div className="grid gap-6">
            
            {/* Technical Documentation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      Technical Documentation
                    </CardTitle>
                    <CardDescription>
                      Complete technical reference including architecture, technologies, and implementation details
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Complete</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comprehensive documentation covering React architecture, Hedera integration, 
                    UI framework, state management, routing, and development tools.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">React 18</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Vite</Badge>
                    <Badge variant="outline">Tailwind</Badge>
                    <Badge variant="outline">Radix UI</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/technical-docs" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Technical Docs <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Development Status */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Development Status & Progress
                    </CardTitle>
                    <CardDescription>
                      Detailed progress tracking across database, frontend, backend, and security features
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Real-time development status with component-level tracking, governance phases, 
                    and implementation roadmap for the DAO-based prediction market system.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Database</Badge>
                    <Badge variant="outline">Frontend</Badge>
                    <Badge variant="outline">Backend</Badge>
                    <Badge variant="outline">Security</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/development-status" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Development Status <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Security Analysis */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Analysis & Review
                    </CardTitle>
                    <CardDescription>
                      Comprehensive security assessment, vulnerability analysis, and implementation roadmap
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Reviewed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Complete security review covering authentication, authorization, input validation, 
                    RLS policies, and external API security. Includes resolved issues and remediation plan.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">3 Resolved</Badge>
                    <Badge variant="outline">2 Critical</Badge>
                    <Badge variant="outline">2 Moderate</Badge>
                    <Badge variant="outline">4 Config</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/security" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Security Analysis <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Security Implementation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Wallet Security Implementation
                    </CardTitle>
                    <CardDescription>
                      20-minute inactivity timeout system with activity monitoring and user warnings
                    </CardDescription>
                  </div>
                  <Badge variant="default">Implemented</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Complete security enhancement featuring automatic wallet timeout after 20 minutes 
                    of inactivity, with comprehensive activity monitoring, 2-minute warning dialogs, and 
                    seamless session extension capabilities.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Activity Monitor</Badge>
                    <Badge variant="outline">20-min Timeout</Badge>
                    <Badge variant="outline">Warning Dialog</Badge>
                    <Badge variant="outline">Auto-Disconnect</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/wallet-security" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Security Implementation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Connection Troubleshooting */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Wallet Connection Troubleshooting
                    </CardTitle>
                    <CardDescription>
                      Comprehensive guide and resolved solutions for WalletConnect errors and DataCloneError issues
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Issues Resolved</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Successfully resolved the "no internet access" WalletConnect error through comprehensive 
                    root cause analysis and implementation of fixes for DataCloneError and postMessage issues.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">DataCloneError ✅</Badge>
                    <Badge variant="outline">postMessage ✅</Badge>
                    <Badge variant="outline">WalletConnect ✅</Badge>
                    <Badge variant="outline">Browser Compatibility ✅</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/wallet-connection" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Resolution Documentation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Storage Implementation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Wallet Storage Implementation
                    </CardTitle>
                    <CardDescription>
                      Complete implementation guide for persistent wallet storage with Supabase integration
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Implemented</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comprehensive documentation of the wallet storage system including user experience flows, 
                    technical architecture, database schema, and implementation details. Features persistent 
                    wallet connections, auto-restoration, and full wallet management interface.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Database Schema</Badge>
                    <Badge variant="outline">React Hooks</Badge>
                    <Badge variant="outline">User Experience</Badge>
                    <Badge variant="outline">Auto-Restore</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/wallet-storage" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Wallet Storage Implementation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* System Configuration Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      System Configuration Management
                    </CardTitle>
                    <CardDescription>
                      Centralized database-driven configuration system replacing environment variables
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Architecture Design</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comprehensive migration plan from environment variables to a centralized Supabase configuration 
                    system with real-time updates, security encryption, admin interface, and type-safe access patterns. 
                    Includes 8-phase implementation strategy with backward compatibility.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Database Schema</Badge>
                    <Badge variant="outline">Migration Plan</Badge>
                    <Badge variant="outline">ConfigService</Badge>
                    <Badge variant="outline">Admin Interface</Badge>
                    <Badge variant="outline">Security</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/system-config" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Configuration Management <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* CLOB Architecture */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      CLOB Architecture Implementation
                    </CardTitle>
                    <CardDescription>
                      Foundation phase completed - CLOB system with UI components and backend services
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Foundation Complete</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Phase 5A foundation completed with database schema, TypeScript interfaces, HCS service integration, 
                    core CLOB logic, order relayer, React hooks, and trading UI components. Ready for next phase: 
                    HCS operator setup and sequencer service implementation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Database Schema</Badge>
                    <Badge variant="outline">UI Components</Badge>
                    <Badge variant="outline">HCS Service</Badge>
                    <Badge variant="outline">Operator Setup</Badge>
                    <Badge variant="outline">Sequencer</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/clob-architecture" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View CLOB Implementation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Image Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      Image Management System
                    </CardTitle>
                    <CardDescription>
                      Upload, organize and manage images with drag & drop functionality and keyword tagging
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Complete image management solution with Supabase Storage integration, drag & drop upload, 
                    keyword tagging system, and full CRUD operations for organizing project assets.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Drag & Drop</Badge>
                    <Badge variant="outline">Keywords</Badge>
                    <Badge variant="outline">Storage</Badge>
                    <Badge variant="outline">Metadata</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/image-management" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Manage Images <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* HCS Topic Test */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      HCS Topic Test
                    </CardTitle>
                    <CardDescription>
                      Interactive testing suite for Hedera Consensus Service topic creation and messaging
                    </CardDescription>
                  </div>
                  <Badge variant="default">Live Testing</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Step-by-step HCS validation tool that walks through the complete topic lifecycle: 
                    credential initialization, client setup, topic creation, and message submission. 
                    Uses stored Hedera testnet credentials from Supabase secrets for secure testing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Hedera SDK</Badge>
                    <Badge variant="outline">Topic Creation</Badge>
                    <Badge variant="outline">Message Testing</Badge>
                    <Badge variant="outline">Live Validation</Badge>
                    <Badge variant="outline">Supabase Secrets</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/hcs-test" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Run HCS Test <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* HCS Timeout Testing */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      HCS Timeout Testing
                    </CardTitle>
                    <CardDescription>
                      Test enhanced timeout configurations and retry mechanisms for improved reliability
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Enhanced Testing</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Specialized testing suite for validating the enhanced HCS timeout configurations including 
                    testnet-optimized settings, progressive retry mechanisms, and network health monitoring.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Timeout Testing</Badge>
                    <Badge variant="outline">Batch Stress Tests</Badge>
                    <Badge variant="outline">Network Stats</Badge>
                    <Badge variant="outline">Enhanced Configs</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/hcs-timeout-testing" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Launch Timeout Tests <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* HCS Async Documentation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      HCS Async Topic Creation
                    </CardTitle>
                    <CardDescription>
                      Asynchronous topic creation system with background processing
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Architecture
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Complete documentation of the async HCS topic creation system featuring 
                    fire-and-forget pattern, background workers, retry logic, and real-time 
                    status updates. Includes process flow diagrams and implementation details.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Non-blocking</span>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Retry Logic</span>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Status Polling</span>
                  </div>
                  <Link 
                    to="/dev-notes/hcs-async" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Async Documentation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                HashyMarket is a decentralized event prediction market platform built on Hedera Hashgraph. 
                The platform enables users to create and participate in prediction markets for various events, 
                leveraging blockchain technology for transparency and decentralization.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Features</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Event prediction markets</li>
                    <li>• Hedera wallet integration</li>
                    <li>• Real-time market data</li>
                    <li>• Portfolio management</li>
                    <li>• DAO governance system</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Tech Stack</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• React 18 + TypeScript</li>
                    <li>• Hedera Hashgraph SDK</li>
                    <li>• Supabase backend</li>
                    <li>• Tailwind CSS + Radix UI</li>
                    <li>• React Query + Context API</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default DevNotesIndex;