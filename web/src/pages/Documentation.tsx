import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const Documentation = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Development Documentation</h1>
            <p className="text-muted-foreground text-lg">
              Complete technical documentation for the HashyMarket platform
            </p>
          </div>

          {/* Architecture Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Architecture Overview</CardTitle>
              <CardDescription>
                High-level architecture of the event prediction markets platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                This application follows a modern React architecture with blockchain integration:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Frontend:</strong> React 18 with TypeScript for type safety</li>
                <li><strong>Blockchain:</strong> Hedera Hashgraph for decentralized predictions</li>
                <li><strong>Backend:</strong> Supabase for user data and market metadata</li>
                <li><strong>Styling:</strong> Tailwind CSS with custom design system</li>
                <li><strong>State Management:</strong> React Query + Context API</li>
              </ul>
            </CardContent>
          </Card>

          {/* Core Technologies */}
          <Card>
            <CardHeader>
              <CardTitle>Core Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* React & TypeScript */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">React + TypeScript</h3>
                  <Badge variant="secondary">v18.3.1</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Modern React with functional components, hooks, and strict TypeScript typing.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• Functional components with hooks</div>
                  <div>• Custom hooks for blockchain integration</div>
                  <div>• Strict TypeScript configuration</div>
                  <div>• Context API for global state</div>
                </div>
              </div>

              <Separator />

              {/* Vite */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Vite Build Tool</h3>
                  <Badge variant="secondary">Latest</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Fast development server with hot module replacement and optimized builds.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• Lightning-fast HMR</div>
                  <div>• TypeScript support out of the box</div>
                  <div>• Optimized production builds</div>
                  <div>• Path aliases configured (@/ for src/)</div>
                </div>
              </div>

              <Separator />

              {/* Hedera Integration */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Hedera Hashgraph</h3>
                  <Badge variant="secondary">SDK v2.71.1</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Blockchain integration for decentralized prediction markets and wallet connectivity.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• @hashgraph/sdk for network interactions</div>
                  <div>• @hashgraph/hedera-wallet-connect for wallet integration</div>
                  <div>• ethers.js for EVM compatibility</div>
                  <div>• Mirror node API for account queries</div>
                  <div>• Testnet configuration (Chain ID: 296)</div>
                </div>
              </div>

              <Separator />

              {/* Supabase */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Supabase Backend</h3>
                  <Badge variant="secondary">v2.56.0</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Backend-as-a-Service for user authentication, database, and real-time features.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• PostgreSQL database with RLS policies</div>
                  <div>• Real-time subscriptions</div>
                  <div>• File storage capabilities</div>
                  <div>• Edge functions for serverless logic</div>
                  <div>• Authentication providers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI Framework */}
          <Card>
            <CardHeader>
              <CardTitle>UI Framework & Design System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Tailwind CSS */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Tailwind CSS</h3>
                  <Badge variant="secondary">Latest</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Utility-first CSS framework with custom design tokens and semantic color system.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• Custom HSL color palette in index.css</div>
                  <div>• Semantic design tokens (--primary, --secondary, etc.)</div>
                  <div>• Dark/light mode support</div>
                  <div>• Custom gradients and shadows</div>
                  <div>• Responsive breakpoints</div>
                </div>
              </div>

              <Separator />

              {/* Radix UI */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Radix UI (shadcn/ui)</h3>
                  <Badge variant="secondary">v1.x</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Accessible, unstyled UI primitives customized with Tailwind CSS.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• 40+ pre-built components</div>
                  <div>• WAI-ARIA compliant</div>
                  <div>• Keyboard navigation support</div>
                  <div>• Customizable with class-variance-authority</div>
                  <div>• Focus management and screen reader support</div>
                </div>
              </div>

              <Separator />

              {/* Theme System */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Custom Theme System</h3>
                  <Badge variant="secondary">Custom</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Dynamic theming with multiple color schemes and background textures.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• Multiple theme variants (default, ocean, forest, etc.)</div>
                  <div>• Background texture system</div>
                  <div>• localStorage persistence</div>
                  <div>• CSS custom properties for theming</div>
                  <div>• Real-time theme switching</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* State Management */}
          <Card>
            <CardHeader>
              <CardTitle>State Management & Data Fetching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* React Query */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">TanStack React Query</h3>
                  <Badge variant="secondary">v5.56.2</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Server state management with caching, synchronization, and background updates.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• Automatic caching and invalidation</div>
                  <div>• Background data synchronization</div>
                  <div>• Optimistic updates</div>
                  <div>• Error handling and retry logic</div>
                  <div>• Hedera balance queries with polling</div>
                </div>
              </div>

              <Separator />

              {/* Context API */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">React Context API</h3>
                  <Badge variant="secondary">Built-in</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Global state management for wallet connection, theme, and user preferences.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• WalletContext for blockchain state</div>
                  <div>• ThemeContext for UI preferences</div>
                  <div>• Provider composition pattern</div>
                  <div>• Type-safe context consumers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routing & Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Routing & Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">React Router DOM</h3>
                  <Badge variant="secondary">v6.26.2</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Client-side routing with nested routes and route protection.
                </p>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• / - Homepage with hero and featured event markets</div>
                  <div>• /markets - Browse all event prediction markets</div>
                  <div>• /market/:id - Individual event market details</div>
                  <div>• /portfolio - User holdings and positions</div>
                  
                  <div>• /docs - This documentation page</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Development Tools & Utilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Form Handling */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Form Management</h3>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• react-hook-form for form state</div>
                  <div>• zod for validation schemas</div>
                  <div>• @hookform/resolvers for integration</div>
                </div>
              </div>

              <Separator />

              {/* Charts & Visualization */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Data Visualization</h3>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• recharts for market price charts</div>
                  <div>• Custom chart components</div>
                  <div>• Responsive chart layouts</div>
                </div>
              </div>

              <Separator />

              {/* Utilities */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Utility Libraries</h3>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div>• clsx + tailwind-merge for className handling</div>
                  <div>• date-fns for date manipulation</div>
                  <div>• lucide-react for icons</div>
                  <div>• sonner for toast notifications</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Project Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="bg-muted p-4 rounded-md text-sm font-mono">
                  <div className="space-y-1">
                    <div>src/</div>
                    <div>├── components/</div>
                    <div>│   ├── Auth/           # Authentication components</div>
                    <div>│   ├── Hero/           # Landing page hero section</div>
                    <div>│   ├── Layout/         # Header, navigation</div>
                    <div>│   ├── Markets/        # Market-related components</div>
                    <div>│   ├── Settings/       # User settings</div>
                    <div>│   ├── Wallet/         # Blockchain wallet components</div>
                    <div>│   └── ui/             # shadcn/ui components</div>
                    <div>├── contexts/           # React contexts</div>
                    <div>├── hooks/              # Custom React hooks</div>
                    <div>├── integrations/</div>
                    <div>│   └── supabase/       # Supabase client & types</div>
                    <div>├── lib/                # Utility functions</div>
                    <div>├── pages/              # Route components</div>
                    <div>├── assets/             # Static assets</div>
                    <div>├── index.css           # Global styles & design tokens</div>
                    <div>└── main.tsx            # Application entry point</div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Environment variables for different deployment stages:
              </p>
              <div className="bg-muted p-3 rounded-md text-sm font-mono">
                <div># Hedera Network Configuration</div>
                <div>VITE_HEDERA_NETWORK=testnet</div>
                <div>VITE_RPC_URL=https://testnet.hashio.io/api</div>
                <div>VITE_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1</div>
                <div>VITE_CHAIN_ID=296</div>
                <div className="mt-2"># Supabase Configuration</div>
                <div>VITE_SUPABASE_URL=[auto-configured]</div>
                <div>VITE_SUPABASE_ANON_KEY=[auto-configured]</div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Code Splitting:</strong> Route-based code splitting with React.lazy</li>
                <li><strong>Bundle Optimization:</strong> Vite's tree-shaking and minification</li>
                <li><strong>Caching:</strong> React Query caches blockchain and API data</li>
                <li><strong>Image Optimization:</strong> WebP format with fallbacks</li>
                <li><strong>CSS Optimization:</strong> Tailwind CSS purges unused styles</li>
                <li><strong>Network Efficiency:</strong> Background polling for Hedera data</li>
              </ul>
            </CardContent>
          </Card>

          {/* Security Considerations */}
          <Card>
            <CardHeader>
              <CardTitle>Security Considerations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Wallet Security:</strong> No private keys stored in application</li>
                <li><strong>RLS Policies:</strong> Supabase Row Level Security for data protection</li>
                <li><strong>Environment Variables:</strong> Sensitive data in environment configs</li>
                <li><strong>Type Safety:</strong> TypeScript prevents runtime errors</li>
                <li><strong>Input Validation:</strong> Zod schemas validate all user inputs</li>
                <li><strong>XSS Protection:</strong> React's built-in XSS protection</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Documentation;