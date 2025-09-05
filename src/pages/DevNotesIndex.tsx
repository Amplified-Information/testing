import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FileText, Code2, BookOpen, ExternalLink, Shield, Wallet, BarChart3 } from "lucide-react";

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
                    <Badge variant="outline" className="text-green-600 border-green-600">3 Resolved</Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">2 Critical</Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">2 Moderate</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">4 Config</Badge>
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
                      Comprehensive guide to resolve WalletConnect errors and DataCloneError issues
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">Action Required</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Detailed analysis of the "no internet access" WalletConnect error, including root cause
                    investigation and a three-phase implementation plan to resolve DataCloneError and postMessage issues.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-red-600 border-red-600">DataCloneError</Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">postMessage</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">WalletConnect</Badge>
                    <Badge variant="outline">Browser Compatibility</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/wallet-connection" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View Wallet Connection Guide <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Storage Implementation */}
            <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Wallet className="h-5 w-5 text-green-600" />
                      Wallet Storage Implementation
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Complete implementation guide for persistent wallet storage with Supabase integration
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600">Implemented ✅</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-green-700">
                    Comprehensive documentation of the wallet storage system including user experience flows, 
                    technical architecture, database schema, and implementation details. Features persistent 
                    wallet connections, auto-restoration, and full wallet management interface.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">Database Schema</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">React Hooks</Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-600">User Experience</Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">Auto-Restore</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/wallet-storage" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                  >
                    View Wallet Storage Implementation <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* CLOB Architecture */}
            <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      CLOB Architecture Implementation
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Foundation phase completed - CLOB system with UI components and backend services
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-600">Foundation Complete ✅</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-green-700">
                    Phase 5A foundation completed with database schema, TypeScript interfaces, HCS service integration, 
                    core CLOB logic, order relayer, React hooks, and trading UI components. Ready for next phase: 
                    HCS operator setup and sequencer service implementation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">Database Schema ✅</Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">UI Components ✅</Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">HCS Service ✅</Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">Operator Setup</Badge>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">Sequencer</Badge>
                  </div>
                  <Link 
                    to="/dev-notes/clob-architecture" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                  >
                    View CLOB Implementation <ExternalLink className="h-4 w-4" />
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