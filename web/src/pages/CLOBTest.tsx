import { OrderMatchingDemo } from '@/components/CLOB/OrderMatchingDemo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CLOBTest() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CLOB Order Matching System Test</h1>
        <p className="text-muted-foreground">
          Demonstration of the off-chain order matching engine with real-time processing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold">Order Queue</div>
              <div className="text-sm text-muted-foreground">Incoming orders await processing</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold">Order Matcher</div>
              <div className="text-sm text-muted-foreground">Price-time priority matching</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">Trade Execution</div>
              <div className="text-sm text-muted-foreground">Instant settlement & positions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibent">HCS Batching</div>
              <div className="text-sm text-muted-foreground">Periodic audit trail</div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="bg-green-50">Off-Chain Matching</Badge>
            <Badge variant="outline" className="bg-blue-50">Real-Time Order Books</Badge>
            <Badge variant="outline" className="bg-purple-50">Automatic Position Management</Badge>
            <Badge variant="outline" className="bg-orange-50">Batched HCS Publishing</Badge>
          </div>
        </CardContent>
      </Card>

      <OrderMatchingDemo />

      <Card>
        <CardHeader>
          <CardTitle>Test Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Market Details</h4>
              <ul className="space-y-1 text-sm">
                <li>• <strong>Market:</strong> Trump Approval Rating</li>
                <li>• <strong>Type:</strong> Binary Prediction Market</li>
                <li>• <strong>Price Range:</strong> 45¢ - 56¢</li>
                <li>• <strong>Total Volume:</strong> 9,150 shares</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Expected Matches</h4>
              <ul className="space-y-1 text-sm">
                <li>• BUY 300 @ 55¢ × SELL 400 @ 47¢ → <strong>300 @ 47¢</strong></li>
                <li>• BUY 600 @ 54¢ × SELL 100 @ 47¢ → <strong>100 @ 47¢</strong></li>
                <li>• BUY 500 @ 54¢ × SELL 500 @ 49¢ → <strong>500 @ 49¢</strong></li>
                <li>• BUY 750 @ 52¢ × SELL 800 @ 50¢ → <strong>750 @ 50¢</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}