import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCLOBOrderBook } from "@/hooks/useCLOB";
import { OrderBookLevel } from "@/types/clob";
import { cn } from "@/lib/utils";

interface OrderBookDisplayProps {
  marketId: string;
  className?: string;
}

const OrderBookDisplay = ({ marketId, className }: OrderBookDisplayProps) => {
  const { data: orderBook, isLoading, error } = useCLOBOrderBook(marketId);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !orderBook) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load order book</p>
        </CardContent>
      </Card>
    );
  }

  const maxQuantity = Math.max(
    ...[...orderBook.bids, ...orderBook.asks].map(level => level.quantity)
  );

  const renderOrderLevel = (level: OrderBookLevel, side: 'bid' | 'ask', index: number) => {
    const percentage = (level.quantity / maxQuantity) * 100;
    const isAsk = side === 'ask';
    
    return (
      <div 
        key={`${side}-${level.price}-${index}`}
        className={cn(
          "relative flex justify-between items-center px-2 py-1 text-sm font-mono",
          "hover:bg-muted/50 transition-colors"
        )}
      >
        {/* Background bar showing quantity depth */}
        <div 
          className={cn(
            "absolute inset-y-0 opacity-20",
            isAsk ? "right-0 bg-destructive" : "left-0 bg-primary"
          )}
          style={{ 
            width: `${percentage}%`,
            ...(isAsk ? { right: 0 } : { left: 0 })
          }}
        />
        
        {/* Price and quantity display */}
        <span className={cn(
          "font-semibold z-10 relative",
          isAsk ? "text-destructive" : "text-primary"
        )}>
          {(level.price / 100).toFixed(2)}¢
        </span>
        <span className="text-muted-foreground z-10 relative">
          {level.quantity.toLocaleString()}
        </span>
      </div>
    );
  };

  const displayAsks = orderBook.asks.slice(0, 10).reverse();
  const displayBids = orderBook.bids.slice(0, 10);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          Order Book
          <span className="text-xs text-muted-foreground font-normal">
            Last updated: {new Date(orderBook.lastUpdate).toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Column headers */}
        <div className="flex justify-between px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
          <span>Price</span>
          <span>Size</span>
        </div>
        
        {/* Asks (sells) - shown on top, reversed order */}
        <div className="border-b">
          {displayAsks.length > 0 ? (
            displayAsks.map((level, index) => 
              renderOrderLevel(level, 'ask', index)
            )
          ) : (
            <div className="px-2 py-4 text-center text-muted-foreground text-sm">
              No asks
            </div>
          )}
        </div>

        {/* Spread indicator */}
        {orderBook.asks.length > 0 && orderBook.bids.length > 0 && (
          <div className="px-2 py-2 text-center text-xs text-muted-foreground bg-muted/30">
            Spread: {((orderBook.asks[0].price - orderBook.bids[0].price) / 100).toFixed(2)}¢
          </div>
        )}
        
        {/* Bids (buys) - shown on bottom */}
        <div>
          {displayBids.length > 0 ? (
            displayBids.map((level, index) => 
              renderOrderLevel(level, 'bid', index)
            )
          ) : (
            <div className="px-2 py-4 text-center text-muted-foreground text-sm">
              No bids
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBookDisplay;