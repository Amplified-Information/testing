import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestOrder {
  order_id: string;
  side: 'BUY' | 'SELL';
  price_ticks: number;
  quantity: number;
  maker_account_id: string;
  status: string;
}

interface PredictedTrade {
  buyOrderId: string;
  sellOrderId: string;
  quantity: number;
  price: number;
  buyer: string;
  seller: string;
}

export const OrderMatchingDemo = () => {
  const [queuedOrders, setQueuedOrders] = useState<TestOrder[]>([]);
  const [predictedTrades, setPredictedTrades] = useState<PredictedTrade[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const marketId = 'af539f2d-8a88-4f04-9ed8-b5604cb9591c';

  useEffect(() => {
    fetchQueuedOrders();
  }, []);

  const fetchQueuedOrders = async () => {
    const { data, error } = await supabase
      .from('order_queue')
      .select('order_id, side, price_ticks, quantity, maker_account_id, status')
      .eq('market_id', marketId)
      .order('priority_score');

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    const typedOrders = (data || []).map(order => ({
      ...order,
      side: order.side as 'BUY' | 'SELL'
    }));
    setQueuedOrders(typedOrders);
    calculatePredictedMatches(typedOrders);
  };

  const calculatePredictedMatches = (orders: TestOrder[]) => {
    const buyOrders = orders.filter(o => o.side === 'BUY' && o.status === 'QUEUED')
      .sort((a, b) => b.price_ticks - a.price_ticks); // Highest price first
    
    const sellOrders = orders.filter(o => o.side === 'SELL' && o.status === 'QUEUED')
      .sort((a, b) => a.price_ticks - b.price_ticks); // Lowest price first

    const matches: PredictedTrade[] = [];
    const buyOrdersCopy = [...buyOrders];
    const sellOrdersCopy = [...sellOrders];

    for (let buyOrder of buyOrdersCopy) {
      let remainingBuyQty = buyOrder.quantity;

      for (let sellOrder of sellOrdersCopy) {
        if (remainingBuyQty <= 0) break;
        
        // Check if prices cross (buy price >= sell price)
        if (buyOrder.price_ticks >= sellOrder.price_ticks) {
          const tradeQty = Math.min(remainingBuyQty, sellOrder.quantity);
          
          matches.push({
            buyOrderId: buyOrder.order_id,
            sellOrderId: sellOrder.order_id,
            quantity: tradeQty,
            price: sellOrder.price_ticks, // Use existing order price (maker price)
            buyer: buyOrder.maker_account_id,
            seller: sellOrder.maker_account_id
          });

          remainingBuyQty -= tradeQty;
          sellOrder.quantity -= tradeQty;
        }
      }
    }

    setPredictedTrades(matches);
  };

  const triggerOrderMatcher = async () => {
    setIsProcessing(true);
    toast.info('Triggering order matcher...');

    try {
      const { data, error } = await supabase.functions.invoke('order-matcher', {
        body: { 
          trigger: 'demo_test',
          marketId: marketId
        }
      });

      if (error) {
        console.error('Order matcher error:', error);
        toast.error('Order matcher failed: ' + error.message);
      } else {
        console.log('Order matcher result:', data);
        toast.success('Order matching completed!');
        
        // Refresh the orders after a short delay
        setTimeout(() => {
          fetchQueuedOrders();
          checkResults();
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to trigger order matcher');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkResults = async () => {
    // Check trades created
    const { data: trades } = await supabase
      .from('clob_trades')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });

    // Check order book
    const { data: orders } = await supabase
      .from('clob_orders')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });

    if (trades && trades.length > 0) {
      toast.success(`Generated ${trades.length} trades!`);
    }
    
    if (orders && orders.length > 0) {
      toast.info(`Created ${orders.length} active orders`);
    }
  };

  const formatPrice = (priceTicks: number) => {
    return `${(priceTicks / 100).toFixed(2)}¢`;
  };

  const queuedBuys = queuedOrders.filter(o => o.side === 'BUY' && o.status === 'QUEUED');
  const queuedSells = queuedOrders.filter(o => o.side === 'SELL' && o.status === 'QUEUED');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Order Matching Demo: Trump Approval Rating Market
            <Button 
              onClick={triggerOrderMatcher} 
              disabled={isProcessing}
              className="ml-4"
            >
              {isProcessing ? 'Processing...' : 'Trigger Order Matcher'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Queued Buy Orders */}
            <div>
              <h3 className="font-semibold mb-3 text-green-600">BUY Orders (Bids)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queuedBuys.map(order => (
                  <div key={order.order_id} className="p-2 border rounded bg-green-50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">{order.order_id.slice(-8)}</span>
                      <Badge variant="outline" className="bg-green-100">BUY</Badge>
                    </div>
                    <div className="text-sm">
                      {order.quantity} @ {formatPrice(order.price_ticks)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.maker_account_id}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Predicted Matches */}
            <div>
              <h3 className="font-semibold mb-3 text-purple-600">Predicted Trades</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictedTrades.map((trade, idx) => (
                  <div key={idx} className="p-2 border rounded bg-purple-50">
                    <div className="text-sm font-medium">
                      Trade {idx + 1}: {trade.quantity} @ {formatPrice(trade.price)}
                    </div>
                    <div className="text-xs text-gray-600">
                      Buy: {trade.buyOrderId.slice(-8)} → Sell: {trade.sellOrderId.slice(-8)}
                    </div>
                  </div>
                ))}
                {predictedTrades.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    No matching prices found
                  </div>
                )}
              </div>
            </div>

            {/* Queued Sell Orders */}
            <div>
              <h3 className="font-semibold mb-3 text-red-600">SELL Orders (Asks)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queuedSells.map(order => (
                  <div key={order.order_id} className="p-2 border rounded bg-red-50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">{order.order_id.slice(-8)}</span>
                      <Badge variant="outline" className="bg-red-100">SELL</Badge>
                    </div>
                    <div className="text-sm">
                      {order.quantity} @ {formatPrice(order.price_ticks)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.maker_account_id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {predictedTrades.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Expected Results:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• {predictedTrades.length} trades will be created</li>
                <li>• Total volume: {predictedTrades.reduce((sum, t) => sum + t.quantity, 0)} shares</li>
                <li>• Price range: {formatPrice(Math.min(...predictedTrades.map(t => t.price)))} - {formatPrice(Math.max(...predictedTrades.map(t => t.price)))}</li>
                <li>• Positions will be created for {new Set([...predictedTrades.map(t => t.buyer), ...predictedTrades.map(t => t.seller)]).size} accounts</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};