import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Clock, 
  Database, 
  Code, 
  Zap,
  Users,
  Vote,
  Settings,
  FileText,
  Coins,
  BarChart3
} from "lucide-react";

const DevelopmentNotes = () => {
  const getStatusIcon = (status: 'completed' | 'in-progress' | 'pending' | 'blocked') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: 'completed' | 'in-progress' | 'pending' | 'blocked') => {
    const variants = {
      completed: 'default',
      'in-progress': 'secondary',
      pending: 'outline',
      blocked: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status.replace('-', ' ')}</Badge>;
  };

  const calculateProgress = (items: Array<{ status: string }>) => {
    const completed = items.filter(item => item.status === 'completed').length;
    return (completed / items.length) * 100;
  };

  // Database Infrastructure Status
  const databaseComponents = [
    { name: 'Governance Enums', status: 'completed', description: 'governance_status, proposal_type, vote_choice, oracle_type' },
    { name: 'User Token Balances', status: 'completed', description: 'Track protocol token holdings and voting power (TODO: PROTOCOL_TOKEN TBD)' },
    { name: 'Staking Positions', status: 'completed', description: 'Enhanced voting power through staking' },
    { name: 'Market Proposals', status: 'completed', description: 'Core proposal data and voting tracking' },
    { name: 'Proposal Votes', status: 'completed', description: 'Individual vote records with HCS integration' },
    { name: 'Voting Power Snapshots', status: 'completed', description: 'Historical voting power tracking' },
    { name: 'Market Deployment Queue', status: 'completed', description: 'Automated market deployment system' },
    { name: 'Governance Settings', status: 'completed', description: 'Configurable governance parameters' },
    { name: 'RLS Policies', status: 'completed', description: 'Row-level security for all tables' },
    { name: 'Database Triggers', status: 'completed', description: 'Automated timestamp updates' },
    { name: 'Performance Indexes', status: 'completed', description: 'Optimized query performance' },
  ];

  const frontendComponents = [
    { name: 'Governance Types', status: 'completed', description: 'TypeScript interfaces for all governance entities' },
    { name: 'useGovernance Hook', status: 'completed', description: 'Central governance data management and mutations' },
    { name: 'Multi-step Proposal Form', status: 'completed', description: '4-step proposal creation with validation' },
    { name: 'Governance Dashboard', status: 'completed', description: 'Voting power display and proposal management' },
    { name: 'Proposal Voting Interface', status: 'completed', description: 'Yes/No/Abstain voting with progress tracking' },
    { name: 'User Proposal Management', status: 'completed', description: 'View and manage user-created proposals' },
    { name: 'Voting History', status: 'completed', description: 'Historical vote tracking and display' },
    { name: 'Quorum Progress Tracking', status: 'completed', description: 'Real-time quorum progress visualization' },
  ];

  const backendIntegration = [
    { name: 'HCS Integration', status: 'pending', description: 'Hedera Consensus Service for tamper-proof voting' },
    { name: 'Wallet Signature Verification', status: 'pending', description: 'Cryptographic vote verification' },
    { name: 'Oracle Integration', status: 'pending', description: 'Chainlink and SUPRA oracle connections' },
    { name: 'Smart Contract Deployment', status: 'pending', description: 'Automated market contract creation' },
    { name: 'HTS Token Creation', status: 'pending', description: 'YES/NO outcome token generation' },
    { name: 'CLOB System', status: 'pending', description: 'Central Limit Order Book implementation' },
    { name: 'Mirror Node Integration', status: 'pending', description: 'Balance verification and transaction monitoring' },
  ];

  const securityFeatures = [
    { name: 'Input Sanitization', status: 'pending', description: 'Prevent malicious proposal content' },
    { name: 'Rate Limiting', status: 'pending', description: 'Proposal submission throttling' },
    { name: 'Signature Validation', status: 'pending', description: 'Cryptographic vote verification' },
    { name: 'Proposal Cooldowns', status: 'completed', description: 'Database-level cooldown enforcement' },
    { name: 'Voting Power Snapshots', status: 'completed', description: 'Prevent voting power manipulation' },
    { name: 'Role-based Access', status: 'completed', description: 'RLS policies for data access control' },
  ];

  const governancePhases = [
    {
      phase: 'Phase 1: Database Infrastructure',
      progress: calculateProgress(databaseComponents),
      components: databaseComponents,
      description: 'Complete database schema for DAO governance with all necessary tables, enums, and policies.'
    },
    {
      phase: 'Phase 2: Frontend Components',
      progress: calculateProgress(frontendComponents),
      components: frontendComponents,
      description: 'React components for proposal creation, voting, and governance dashboard.'
    },
    {
      phase: 'Phase 3: Backend Integration',
      progress: calculateProgress(backendIntegration),
      components: backendIntegration,
      description: 'Hedera blockchain integration for smart contracts, oracles, and consensus.'
    },
    {
      phase: 'Phase 4: Security & Production',
      progress: calculateProgress(securityFeatures),
      components: securityFeatures,
      description: 'Security hardening and production-ready features.'
    },
    {
      phase: 'Phase 5: CLOB Implementation',
      progress: calculateProgress([
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' }
      ]),
      components: [
        { name: 'Database Schema', status: 'completed', description: '7 CLOB tables with RLS policies' },
        { name: 'TypeScript Interfaces', status: 'completed', description: 'Complete CLOB type definitions' },
        { name: 'HCS Service Integration', status: 'completed', description: 'Hedera Consensus Service wrapper' },
        { name: 'CLOB Core Service', status: 'completed', description: 'Order book and trading logic' },
        { name: 'Order Relayer Edge Function', status: 'completed', description: 'Supabase edge function for HCS publishing' },
        { name: 'React Hooks & State Management', status: 'completed', description: 'useCLOB hooks for data fetching' },
        { name: 'UI Components', status: 'completed', description: 'Order book, trading interface, order history' },
        { name: 'MarketDetail Integration', status: 'completed', description: 'CLOB tab added to market pages' },
        { name: 'HCS Topics Setup', status: 'pending', description: 'Hedera operator credentials needed' },
        { name: 'Settlement Smart Contracts', status: 'pending', description: 'Hedera EVM contracts with HTS integration' },
        { name: 'Sequencer Service', status: 'pending', description: 'Deterministic batch processing' },
        { name: 'Fraud Proof System', status: 'pending', description: 'Optimistic dispute resolution' }
      ],
      description: 'Central Limit Order Book with off-chain matching and on-chain settlement.'
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                DAO Market Creation - Development Notes
              </CardTitle>
              <CardDescription>
                Comprehensive development plan and status for the DAO-based prediction market system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {governancePhases.map((phase, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-2">
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                    <p className="text-sm font-medium">{phase.phase}</p>
                    <p className="text-xs text-muted-foreground">{phase.progress.toFixed(0)}% Complete</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="backend">Backend</TabsTrigger>
              <TabsTrigger value="clob">CLOB</TabsTrigger>
              <TabsTrigger value="resolution">Resolution</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Architecture Overview</CardTitle>
                  <CardDescription>
                    DAO-based prediction market system similar to PolyMarket with Hedera blockchain integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Vote className="h-4 w-4" />
                        Governance Flow
                      </h4>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">1</span>
                          Proposal Creation (100K voting power minimum) {/* TODO: Define PROTOCOL_TOKEN */}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">2</span>
                          Proposal Phase (24 hours, 5M quorum)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">3</span>
                          Election Phase (24 hours, 10M quorum)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">4</span>
                          Automated Market Deployment
                        </li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Key Features Implemented
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Multi-step proposal creation form
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Token-weighted voting system
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Real-time quorum tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Comprehensive governance dashboard
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          HCS tamper-proof voting (pending)
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          Smart contract deployment (pending)
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          CLOB trading system (phase 5)
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {governancePhases.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{phase.phase}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Progress value={phase.progress} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground">{phase.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phase.components.map((component, componentIndex) => (
                        <div key={componentIndex} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(component.status as any)}
                            <span className="text-sm font-medium">{component.name}</span>
                          </div>
                          {getStatusBadge(component.status as any)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Schema Implementation
                  </CardTitle>
                  <CardDescription>
                    Complete Supabase database structure for DAO governance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Core Tables</h4>
                      <ul className="space-y-2 text-sm">
                        <li><code className="bg-muted px-1 rounded">user_token_balances</code> - Protocol token tracking (TODO: PROTOCOL_TOKEN TBD)</li>
                        <li><code className="bg-muted px-1 rounded">staking_positions</code> - Enhanced voting power</li>
                        <li><code className="bg-muted px-1 rounded">market_proposals</code> - Proposal lifecycle management</li>
                        <li><code className="bg-muted px-1 rounded">proposal_votes</code> - Individual vote records</li>
                        <li><code className="bg-muted px-1 rounded">voting_power_snapshots</code> - Historical tracking</li>
                        <li><code className="bg-muted px-1 rounded">market_deployment_queue</code> - Automated deployment</li>
                        <li><code className="bg-muted px-1 rounded">governance_settings</code> - Configurable parameters</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Security Features</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Row Level Security (RLS) enabled
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          User-specific data access policies
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Public read access for transparency
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Service role administrative access
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Automated timestamp triggers
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Performance-optimized indexes
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Default Governance Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Minimum Proposal Power:</span>
                          <Badge variant="outline">100,000 TOKEN</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Proposal Quorum:</span>
                          <Badge variant="outline">5,000,000 TOKEN</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Election Quorum:</span>
                          <Badge variant="outline">10,000,000 TOKEN</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Proposal Duration:</span>
                          <Badge variant="outline">24 hours</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Election Duration:</span>
                          <Badge variant="outline">24 hours</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Failed Proposal Cooldown:</span>
                          <Badge variant="outline">2 weeks</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="frontend" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Frontend Implementation
                  </CardTitle>
                  <CardDescription>
                    React components and hooks for DAO governance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Core Components</h4>
                      <div className="space-y-3">
                        <div className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">ProposalForm</span>
                            <Badge>Completed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Multi-step form with validation, progress tracking, and oracle configuration
                          </p>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">GovernanceDashboard</span>
                            <Badge>Completed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Voting power display, active proposals, and voting history
                          </p>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">useGovernance Hook</span>
                            <Badge>Completed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Central data management with React Query integration
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Features Implemented</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          4-step proposal creation wizard
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Real-time voting power validation
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Oracle type selection and configuration
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Progress tracking and quorum visualization
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Responsive design with Tailwind CSS
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Error handling and loading states
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Toast notifications for user feedback
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backend" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Backend Integration Status
                  </CardTitle>
                  <CardDescription>
                    Hedera blockchain and smart contract integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        Pending Implementation
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          Hedera Consensus Service (HCS) integration
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          Wallet signature verification
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          Smart contract deployment automation
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          HTS token creation for YES/NO outcomes
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          Oracle integration (Chainlink/SUPRA)
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          CLOB (Central Limit Order Book) system
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Technical Requirements</h4>
                      <div className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-3">
                          <h5 className="font-medium">Smart Contracts</h5>
                          <p className="text-sm text-muted-foreground">
                            Solidity contracts on Hedera Smart Contract Service (HSCS) for governance, 
                            market creation, and trading logic.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-green-500 pl-3">
                          <h5 className="font-medium">HCS Integration</h5>
                          <p className="text-sm text-muted-foreground">
                            Tamper-proof proposal submission and voting via Hedera Consensus Service 
                            with JSON payloads and wallet signatures.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-purple-500 pl-3">
                          <h5 className="font-medium">Oracle Services</h5>
                          <p className="text-sm text-muted-foreground">
                            Integration with Chainlink and SUPRA oracles for automated market resolution 
                            based on real-world data.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clob" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Phase 5: CLOB Implementation Plan
                  </CardTitle>
                  <CardDescription>
                    Central Limit Order Book architecture with Hedera services integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">CLOB Architecture Overview</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span>Off-chain order matching with HCS ordering</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span>EVM settlement contracts with HTS integration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span>Optimistic dispute resolution with fraud proofs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span>Permissionless relayer network</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Implementation Phases</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">5A: Foundation & Infrastructure</span>
                          <Badge variant="outline">4-6 weeks</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">5B: Core Trading Engine</span>
                          <Badge variant="outline">6-8 weeks</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">5C: Advanced Features</span>
                          <Badge variant="outline">4-6 weeks</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">5D: Production & Optimization</span>
                          <Badge variant="outline">3-4 weeks</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Core Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">HCS Topics Setup</span>
                        </div>
                        <Badge variant="outline">Planned</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">Settlement Smart Contracts</span>
                        </div>
                        <Badge variant="outline">Planned</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">Order Matching Engine</span>
                        </div>
                        <Badge variant="outline">Planned</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">Fraud Proof System</span>
                        </div>
                        <Badge variant="outline">Planned</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Database Extensions</h5>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• clob_markets - Market parameters & tick sizes</li>
                          <li>• clob_orders - Signed orders with HCS references</li>
                          <li>• clob_batches - Sequencer output & settlement</li>
                          <li>• clob_trades - Executed trade history</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Edge Functions</h5>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>• Relayer service for order publication</li>
                          <li>• Sequencer for deterministic matching</li>
                          <li>• Oracle service for market resolution</li>
                          <li>• Watcher service for fraud detection</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Message Flow & Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-xs overflow-auto">
{`Trader → Relayer → HCS Topic (orders) → Sequencer → HCS Topic (batches) → Settlement Contract → HTS Updates

1. Trader signs EIP-712 order locally
2. Relayer validates and publishes to HCS orders topic  
3. Sequencer reads orders, creates deterministic batches
4. Sequencer publishes batch to HCS batches topic
5. Settlement contract verifies and executes via HTS
6. Watchers validate batches, submit fraud proofs if needed`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Market Resolution & HCS Topic Lifecycle
                  </CardTitle>
                  <CardDescription>
                    Critical operational considerations for market lifecycle management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Critical: HCS Topic Auto-Renewal</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Each market creates 4 HCS topics with 90-day auto-renewal periods. Without cleanup, 
                      resolved markets will continue incurring HBAR charges indefinitely.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        HCS Topics Per Market
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li><code className="bg-muted px-2 py-1 rounded">orders-topic</code> - Order submissions</li>
                        <li><code className="bg-muted px-2 py-1 rounded">batches-topic</code> - Batch processing</li>
                        <li><code className="bg-muted px-2 py-1 rounded">oracle-topic</code> - Market resolution data</li>
                        <li><code className="bg-muted px-2 py-1 rounded">disputes-topic</code> - Fraud proofs</li>
                      </ul>
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-xs text-blue-700">
                          <strong>Auto-renewal:</strong> 90 days (7,776,000 seconds)<br/>
                          Each topic renews automatically using the operator account
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Cleanup Trigger Points
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-current" />
                          Market <code className="bg-muted px-1 rounded">resolution_status = 'resolved'</code>
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-current" />
                          Market <code className="bg-muted px-1 rounded">resolution_status = 'cancelled'</code>
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-current" />
                          Market <code className="bg-muted px-1 rounded">end_date</code> has passed
                        </li>
                        <li className="flex items-center gap-2">
                          <Circle className="h-2 w-2 fill-current" />
                          Manual admin intervention (if needed)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Required Implementation Components</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded p-4">
                        <h5 className="font-medium mb-2">Database Triggers</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          Automatically detect market resolution events
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• Monitor <code>resolution_status</code> changes</li>
                          <li>• Track <code>end_date</code> expiration</li>
                          <li>• Queue cleanup jobs</li>
                        </ul>
                      </div>

                      <div className="border rounded p-4">
                        <h5 className="font-medium mb-2">Edge Function</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          Process HCS topic deactivation
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• Remove auto-renew accounts</li>
                          <li>• Update database <code>is_active = false</code></li>
                          <li>• Handle errors gracefully</li>
                        </ul>
                      </div>

                      <div className="border rounded p-4">
                        <h5 className="font-medium mb-2">Background Job</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          Periodic cleanup validation
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• Find stale resolved markets</li>
                          <li>• Cleanup missed topics</li>
                          <li>• Generate cost reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <h4 className="font-semibold text-red-800">Important Note</h4>
                    </div>
                    <p className="text-sm text-red-700">
                      HCS topics cannot be deleted once created, only deactivated by removing the auto-renew account.
                      This cleanup system is essential to prevent ongoing HBAR charges for resolved markets.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Implementation Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">HCS Topic Cleanup Service</span>
                        </div>
                        <Badge variant="outline">pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">Market Resolution Triggers</span>
                        </div>
                        <Badge variant="outline">pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">Background Cleanup Job</span>
                        </div>
                        <Badge variant="outline">pending</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">Cost Monitoring Dashboard</span>
                        </div>
                        <Badge variant="outline">pending</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="architecture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Architecture Diagram</CardTitle>
                  <CardDescription>
                    High-level overview of the DAO prediction market system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Frontend Layer
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• React + TypeScript</li>
                          <li>• Tailwind CSS + shadcn/ui</li>
                          <li>• React Query for state management</li>
                          <li>• Wallet integration (HashPack)</li>
                          <li>• Real-time updates</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Backend Layer
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Supabase PostgreSQL</li>
                          <li>• Row Level Security (RLS)</li>
                          <li>• Real-time subscriptions</li>
                          <li>• Edge functions for automation</li>
                          <li>• Comprehensive indexing</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Coins className="h-4 w-4" />
                          Blockchain Layer
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Hedera Smart Contracts (pending)</li>
                          <li>• HCS consensus service (pending)</li>
                          <li>• HTS token creation (pending)</li>
                          <li>• Oracle integration (pending)</li>
                          <li>• Mirror node queries (pending)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border rounded p-4">
                      <h4 className="font-semibold mb-3">Data Flow</h4>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">1</span>
                          User creates proposal through multi-step form with validation
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">2</span>
                          Proposal stored in Supabase with RLS policies for security
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">3</span>
                          HCS integration submits tamper-proof proposal record (pending)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">4</span>
                          Token holders vote with cryptographic signatures (pending)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">5</span>
                          Approved proposals trigger automated smart contract deployment (pending)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">6</span>
                          Markets go live with HTS tokens and CLOB trading (pending)
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DevelopmentNotes;