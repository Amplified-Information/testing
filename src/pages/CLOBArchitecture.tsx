import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Clock, 
  Database, 
  Code, 
  Zap,
  Users,
  Vote,
  Settings,
  FileText,
  Coins,
  BarChart3,
  Shield,
  Network,
  Cpu,
  Layers,
  Workflow
} from "lucide-react";

const CLOBArchitecture = () => {
  const getStatusIcon = (status: 'completed' | 'in-progress' | 'pending' | 'blocked' | 'planned') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: 'completed' | 'in-progress' | 'pending' | 'blocked' | 'planned') => {
    const variants = {
      completed: 'default',
      'in-progress': 'secondary',
      pending: 'outline',
      blocked: 'destructive',
      planned: 'secondary'
    } as const;
    
    return <Badge variant={variants[status]}>{status.replace('-', ' ')}</Badge>;
  };

  const calculateProgress = (items: Array<{ status: string }>) => {
    const completed = items.filter(item => item.status === 'completed').length;
    return (completed / items.length) * 100;
  };

  // CLOB Infrastructure & Foundation
  const foundationComponents = [
    { name: 'HCS Topics Setup', status: 'planned', description: 'Orders, batches, and oracle consensus topics' },
    { name: 'Message Schema (TypeScript)', status: 'planned', description: 'EIP-712 style order and batch interfaces' },
    { name: 'Settlement Smart Contract', status: 'planned', description: 'Hedera EVM contract with HTS integration' },
    { name: 'Basic Relayer Service', status: 'planned', description: 'Edge function for order publication to HCS' },
    { name: 'Database Schema Extensions', status: 'planned', description: 'CLOB markets, orders, batches tables' }
  ];

  const coreEngineComponents = [
    { name: 'Sequencer/Batcher Service', status: 'planned', description: 'Deterministic order matching engine' },
    { name: 'Order Matching Logic', status: 'planned', description: 'Price-time priority with batch auctions' },
    { name: 'Merkle Tree Implementation', status: 'planned', description: 'Provable order inclusion and book states' },
    { name: 'HTS Token Integration', status: 'planned', description: 'Collateral and outcome token management' },
    { name: 'Gas Optimization Patterns', status: 'planned', description: 'Internal ledger vs direct HTS transfers' }
  ];

  const advancedFeatures = [
    { name: 'Oracle Integration', status: 'planned', description: 'Market resolution with dispute mechanisms' },
    { name: 'Watcher/Fraud-proof System', status: 'planned', description: 'Optimistic dispute resolution' },
    { name: 'Force Settlement Mechanisms', status: 'planned', description: 'Anti-censorship fallback paths' },
    { name: 'Multi-signature Committee', status: 'planned', description: 'Threshold signatures for batch validation' },
    { name: 'Dispute Window Processing', status: 'planned', description: 'Time-locked finality with challenges' }
  ];

  const productionFeatures = [
    { name: 'Cost Management System', status: 'planned', description: 'Hedera fee optimization and prediction' },
    { name: 'Performance Monitoring', status: 'planned', description: 'Real-time metrics and alerts' },
    { name: 'Security Auditing', status: 'planned', description: 'Smart contract and system audits' },
    { name: 'Load Testing & Optimization', status: 'planned', description: 'High-throughput testing scenarios' },
    { name: 'Analytics Dashboard', status: 'planned', description: 'Trading metrics and system health' }
  ];

  const clobPhases = [
    {
      phase: 'Phase 5A: Foundation & Infrastructure',
      progress: calculateProgress(foundationComponents),
      components: foundationComponents,
      description: 'Core CLOB infrastructure including HCS topics, smart contracts, and message schemas.',
      priority: 'High',
      timeline: '4-6 weeks'
    },
    {
      phase: 'Phase 5B: Core Trading Engine',
      progress: calculateProgress(coreEngineComponents),
      components: coreEngineComponents,
      description: 'Order matching engine, sequencer, and deterministic batch processing.',
      priority: 'High',
      timeline: '6-8 weeks'
    },
    {
      phase: 'Phase 5C: Advanced Features',
      progress: calculateProgress(advancedFeatures),
      components: advancedFeatures,
      description: 'Oracle integration, fraud proofs, and dispute resolution mechanisms.',
      priority: 'Medium',
      timeline: '4-6 weeks'
    },
    {
      phase: 'Phase 5D: Production & Optimization',
      progress: calculateProgress(productionFeatures),
      components: productionFeatures,
      description: 'Production hardening, cost optimization, and comprehensive monitoring.',
      priority: 'Medium',
      timeline: '3-4 weeks'
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
                <BarChart3 className="h-5 w-5" />
                CLOB Architecture - Central Limit Order Book Implementation
              </CardTitle>
              <CardDescription>
                Comprehensive specification and implementation plan for an off-chain CLOB using Hedera services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {clobPhases.map((phase, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-2">
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                    <p className="text-sm font-medium">{phase.phase.split(': ')[1]}</p>
                    <p className="text-xs text-muted-foreground">{phase.progress.toFixed(0)}% Complete</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {phase.timeline}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="economics">Economics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>CLOB System Overview</CardTitle>
                  <CardDescription>
                    Off-chain Central Limit Order Book with Hedera Consensus Service ordering and EVM settlement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Trading Flow
                      </h4>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">1</span>
                          Trader signs JSON order (EIP-712 style)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">2</span>
                          Relayer publishes to HCS orders topic
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">3</span>
                          Sequencer creates deterministic batches
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">4</span>
                          Settlement contract executes via HTS
                        </li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Key Architecture Benefits
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          HCS provides tamper-proof ordering
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Off-chain matching for high throughput
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          EVM settlement with HTS integration
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Optimistic dispute resolution
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Permissionless relayer network
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {clobPhases.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{phase.phase}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{phase.priority} Priority</Badge>
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

            <TabsContent value="architecture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    System Architecture Diagram
                  </CardTitle>
                  <CardDescription>
                    Component interaction flow and data pathways
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-6 rounded-lg">
                    <pre className="text-sm overflow-auto">
{`┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Trader Client │    │     Relayer     │    │   HCS Topics    │
│                 │    │                 │    │                 │
│ • Sign Orders   │───▶│ • Validate      │───▶│ • Orders Stream │
│ • Hold Keys     │    │ • Publish to    │    │ • Batch Stream  │
│ • Manage Tokens │    │   HCS Topics    │    │ • Oracle Stream │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Settlement    │    │   Sequencer/    │    │   HCS Consumer  │
│   Contract      │    │    Batcher      │    │                 │
│                 │◀───│                 │◀───│ • Read Orders   │
│ • Verify Sigs   │    │ • Match Orders  │    │ • Read Batches  │
│ • Execute HTS   │    │ • Create Batches│    │ • Deterministic │
│ • Update State  │    │ • Post to HCS   │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       ▲
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  HTS Tokens     │    │ Fraud Watchers  │    │     Oracle      │
│                 │    │                 │    │                 │
│ • USDC/HBAR     │    │ • Validate      │    │ • Market        │
│ • Outcome       │    │   Batches       │    │   Resolution    │
│   Tokens        │    │ • Submit Proofs │    │ • Post to HCS   │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Message Schemas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Order Message (EIP-712)</h5>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
{`{
  "domain": "CLOB-v1",
  "marketId": "string",
  "maker": "accountId",
  "side": "BUY|SELL",
  "priceTicks": 4500,
  "qty": 1000,
  "tif": "GTC|IOC|FOK|GTD",
  "expiry": 169xxxxxxx,
  "nonce": "u64",
  "maxCollateral": 100000000,
  "timestamp": 169xxxxxxx
}`}
                        </pre>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Batch Message</h5>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
{`{
  "batchId": "u64",
  "marketId": "string", 
  "windowStart": 169xxxxxx,
  "windowEnd": 169xxxxxx,
  "inputOrderRoot": "merkleRoot",
  "trades": [...],
  "cancels": [...],
  "bookSnapshotRoot": "merkleRoot",
  "sequencerSignature": "thresholdSig"
}`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Smart Contract Interface
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Core Functions</h5>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
{`interface ISettlement {
  function depositCollateral(
    address token, 
    uint256 amount
  ) external;
  
  function settleBatch(
    bytes calldata batchBytes,
    bytes calldata sequencerSig
  ) external;
  
  function forceSubmitOrder(
    bytes calldata orderBytes
  ) external;
  
  function resolveMarket(
    bytes32 marketId,
    bytes calldata oracleMsg
  ) external;
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Relayer Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Permissionless network accepting and publishing signed orders to HCS topics.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Order validation</span>
                        <Badge variant="outline">Signature + Schema</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>HCS publishing</span>
                        <Badge variant="outline">Consensus ordering</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Book snapshots</span>
                        <Badge variant="outline">CDN + Merkle proofs</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Sequencer/Batcher
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Stateless service producing deterministic match batches from HCS order stream.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Matching engine</span>
                        <Badge variant="outline">Price-time priority</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Batch frequency</span>
                        <Badge variant="outline">1-3 second windows</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Output format</span>
                        <Badge variant="outline">Merkle-proven batches</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Settlement Contract
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Hedera EVM contract handling batch verification and HTS token transfers.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Signature verification</span>
                        <Badge variant="outline">Committee multisig</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>State management</span>
                        <Badge variant="outline">Internal ledger</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>HTS integration</span>
                        <Badge variant="outline">Lazy transfers</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Fraud Watchers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Independent validators recomputing batches and challenging invalid operations.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Batch validation</span>
                        <Badge variant="outline">Independent compute</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Dispute window</span>
                        <Badge variant="outline">Time-locked finality</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Proof submission</span>
                        <Badge variant="outline">On-chain challenges</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="implementation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Roadmap</CardTitle>
                  <CardDescription>
                    Detailed development phases with technical milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database Schema Extensions Required
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">New Tables</h5>
                          <ul className="space-y-1 text-sm">
                            <li><code className="bg-muted px-1 rounded">clob_markets</code> - Market parameters, tick sizes</li>
                            <li><code className="bg-muted px-1 rounded">clob_orders</code> - Signed orders with HCS refs</li>
                            <li><code className="bg-muted px-1 rounded">clob_batches</code> - Sequencer output & settlement</li>
                            <li><code className="bg-muted px-1 rounded">clob_trades</code> - Executed trade history</li>
                            <li><code className="bg-muted px-1 rounded">oracle_submissions</code> - Resolution data</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Enhanced Tables</h5>
                          <ul className="space-y-1 text-sm">
                            <li><code className="bg-muted px-1 rounded">event_markets</code> - CLOB market type support</li>
                            <li><code className="bg-muted px-1 rounded">market_options</code> - Tick-based pricing</li>
                            <li><code className="bg-muted px-1 rounded">hedera_wallets</code> - Signature verification keys</li>
                            <li><code className="bg-muted px-1 rounded">profiles</code> - Trading permissions & limits</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Edge Functions Required
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Relayer Service</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-xs space-y-1">
                              <li>• Order validation & signing</li>
                              <li>• HCS topic publishing</li>
                              <li>• Order book snapshots</li>
                              <li>• WebSocket API for traders</li>
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Sequencer Service</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-xs space-y-1">
                              <li>• HCS stream consumption</li>
                              <li>• Deterministic matching</li>
                              <li>• Batch creation & signing</li>
                              <li>• Merkle tree generation</li>
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Oracle Service</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-xs space-y-1">
                              <li>• External API integration</li>
                              <li>• Resolution data validation</li>
                              <li>• HCS resolution publishing</li>
                              <li>• Dispute period management</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Dispute Resolution
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security model with optimistic finality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Security Layers</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span><strong>HCS Consensus:</strong> Tamper-proof message ordering</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span><strong>Committee Signatures:</strong> Multi-sig batch validation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span><strong>Merkle Proofs:</strong> Provable state transitions</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span><strong>Fraud Watchers:</strong> Independent validation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span><strong>Force Paths:</strong> Anti-censorship mechanisms</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Dispute Process</h4>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">1</span>
                          <div>
                            <strong>Batch Submission:</strong> Sequencer posts batch to HCS and contract
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">2</span>
                          <div>
                            <strong>Dispute Window:</strong> T_dispute seconds for challenge submission
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">3</span>
                          <div>
                            <strong>Proof Verification:</strong> On-chain validation of fraud proofs
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">4</span>
                          <div>
                            <strong>Finality:</strong> Batch becomes final or gets reverted
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attack Vectors & Mitigations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm text-red-600 mb-1">Sequencer Manipulation</h5>
                        <p className="text-xs text-muted-foreground">Fraud watchers verify all batches independently</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-red-600 mb-1">Relayer Censorship</h5>
                        <p className="text-xs text-muted-foreground">Force submission paths bypass relayers</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-red-600 mb-1">Front-running</h5>
                        <p className="text-xs text-muted-foreground">Batch auctions with uniform clearing prices</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-red-600 mb-1">MEV Extraction</h5>
                        <p className="text-xs text-muted-foreground">Deterministic matching with HCS ordering</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audit Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Smart Contract Audit</span>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sequencer Logic Review</span>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cryptographic Primitives</span>
                        <Badge variant="destructive">Required</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Economic Security Model</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Infrastructure Security</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="economics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Economic Model & Cost Analysis
                  </CardTitle>
                  <CardDescription>
                    Hedera fee optimization and cost-effective settlement patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Settlement Patterns</h4>
                      <div className="space-y-3">
                        <div className="border rounded p-3">
                          <h5 className="font-medium text-sm text-green-600 mb-2">Internal Ledger (Recommended)</h5>
                          <ul className="text-xs space-y-1">
                            <li>• Contract storage updates per trade</li>
                            <li>• Batch HTS transfers on withdrawal</li>
                            <li>• ~10k-50k gas per trade</li>
                            <li>• Minimal HTS transaction fees</li>
                          </ul>
                        </div>
                        <div className="border rounded p-3">
                          <h5 className="font-medium text-sm text-orange-600 mb-2">Direct HTS (Simple)</h5>
                          <ul className="text-xs space-y-1">
                            <li>• Immediate HTS transfers per trade</li>
                            <li>• Higher per-transaction costs</li>
                            <li>• Simpler contract logic</li>
                            <li>• Real-time balance updates</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Cost Projections</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>HCS Message (Order):</span>
                          <Badge variant="outline">~$0.0001</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>HCS Message (Batch):</span>
                          <Badge variant="outline">~$0.0001</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>settleBatch (100 trades):</span>
                          <Badge variant="outline">~$0.50-2.50</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>HTS Transfer (batched):</span>
                          <Badge variant="outline">~$0.001</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Total per trade:</span>
                          <Badge variant="default">~$0.005-0.025</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Optimization Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span><strong>Batch Size Limits:</strong> Max 200 trades per batch</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span><strong>Gas Estimation:</strong> Dynamic batch sizing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span><strong>HTS Bundling:</strong> Multi-transfer transactions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span><strong>Netting:</strong> Reduce transfer frequency</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span><strong>Peak Avoidance:</strong> Off-peak batch processing</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue Model</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Trading Fees:</span>
                        <Badge variant="outline">0.1-0.5%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Withdrawal Fees:</span>
                        <Badge variant="outline">Fixed $0.01</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Creation:</span>
                        <Badge variant="outline">$1-10</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Oracle Resolution:</span>
                        <Badge variant="outline">$0.10</Badge>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Protocol Revenue:</span>
                        <Badge variant="default">Net positive</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CLOBArchitecture;