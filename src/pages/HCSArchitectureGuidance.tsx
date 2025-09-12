import Header from "@/components/Layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Target, Zap } from "lucide-react";

const HCSArchitectureGuidance = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">HCS Architecture Guidance</h1>
            <p className="text-muted-foreground text-lg">
              Best practices for Hedera Consensus Service integration in prediction markets
            </p>
          </div>

          {/* Key Principle */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle>Core Principle: Scalability Over Per-Order Topics</CardTitle>
              </div>
              <CardDescription>
                Don't create a topic per order. Use one topic per market/event and/or off-chain order book with batched HCS commits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="font-semibold text-destructive">Avoid This Anti-Pattern</span>
                </div>
                <p className="text-sm">
                  Creating individual HCS topics for each order leads to thousands of topics, 
                  timeout issues (especially on testnet), and poor scalability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Pattern 1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <CardTitle>One Topic per Market (or per Event)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Structure:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Create a single HCS topic for each prediction market (e.g., "Will Candidate X win?")</li>
                  <li>All buy/sell orders for that market are messages on that topic</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Benefits:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Avoids creating thousands of topics</li>
                  <li>Messages are ordered deterministically by HCS, giving you a canonical order book</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Implementation Tip:</h4>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div className="text-muted-foreground mb-2">// Message payload structure</div>
                  <div>{'{'}</div>
                  <div>  orderId: "order_123",</div>
                  <div>  userId: "user_456",</div>
                  <div>  type: "buy" | "sell",</div>
                  <div>  quantity: 100,</div>
                  <div>  price: 0.65</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Pattern 2 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <CardTitle>Off-chain Order Book + On-chain Settlement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Structure:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Use Supabase (or another DB) to store and match orders off-chain</li>
                  <li>Only commit finalized trades or batches to HCS for auditability</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Benefits:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Near-instant order matching</li>
                  <li>Reduces HCS messages drastically—pay for auditable checkpoints, not every micro-order</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Implementation Tip:</h4>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p>
                    Periodically flush a batch of orders to HCS: e.g., "orders 101–200 matched at prices X, Y, Z."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Pattern 3 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <CardTitle>Hybrid Approach</CardTitle>
                <Badge variant="secondary" className="ml-2">Recommended</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>Fast matching off-chain:</strong> Supabase queue + worker handles incoming orders</li>
                <li><strong>Batch to HCS for transparency:</strong> Every N orders or every few seconds, push a batch to the HCS topic</li>
                <li><strong>Real-time updates:</strong> Clients still see real-time updates from the DB or Supabase Realtime</li>
              </ul>
            </CardContent>
          </Card>

          <Separator />

          {/* Recommended Architecture */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>Recommended Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Event Topic Table</h4>
                    <p className="text-sm text-muted-foreground">One per prediction market</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Order Table</h4>
                    <p className="text-sm text-muted-foreground">Off-chain, real-time order storage</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Async Worker</h4>
                    <p className="text-sm text-muted-foreground">Consumes orders, matches them, periodically publishes batch messages to HCS for immutable audit trail</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Client</h4>
                    <p className="text-sm text-muted-foreground">Subscribes to the DB or a "recent orders" topic for live updates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Summary */}
          <Card className="bg-green-50/50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-green-800">Benefits of This Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">More Scalable</div>
                  <p className="text-sm text-green-700">Handles thousands of orders without creating individual topics</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">Cheaper</div>
                  <p className="text-sm text-green-700">Reduces HCS transaction costs by batching operations</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">More Reliable</div>
                  <p className="text-sm text-green-700">Avoids the testnet/mainnet HCS timeout nightmare</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HCSArchitectureGuidance;