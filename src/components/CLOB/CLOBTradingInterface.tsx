import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useSubmitCLOBOrder, useCLOBOrderBuilder, useCLOBPositions } from "@/hooks/useCLOB";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CLOBTradingInterfaceProps {
  marketId: string;
  className?: string;
}

const CLOBTradingInterface = ({ marketId, className }: CLOBTradingInterfaceProps) => {
  const { wallet, connect, walletConnector } = useWallet();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK'>('GTC');
  const [useSmartContract, setUseSmartContract] = useState(true); // Default to smart contract

  const { buildOrder } = useCLOBOrderBuilder();
  const submitOrderMutation = useSubmitCLOBOrder(walletConnector, useSmartContract);
  const { data: positions } = useCLOBPositions(wallet.accountId, marketId);

  const isConnected = wallet.isConnected && wallet.accountId;

  const handleSubmitOrder = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!price || !quantity) {
      toast.error('Please enter both price and quantity');
      return;
    }

    try {
      const priceInTicks = Math.round(parseFloat(price) * 100); // Convert price to ticks
      const qty = parseInt(quantity);
      const maxCollateral = side === 'BUY' ? priceInTicks * qty : qty; // Simplified collateral calculation

      const order = await buildOrder({
        marketId,
        side,
        priceTicks: priceInTicks,
        qty,
        maxCollateral,
        tif: timeInForce,
      });

      await submitOrderMutation.mutateAsync(order);
      
      // Reset form
      setPrice('');
      setQuantity('');
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

  const currentPosition = positions?.find(p => p.marketId === marketId);
  const yesPosition = positions?.find(p => p.marketId === marketId && p.positionType === 'YES');
  const noPosition = positions?.find(p => p.marketId === marketId && p.positionType === 'NO');

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          CLOB Trading
          {currentPosition && (
            <Badge variant={currentPosition.unrealizedPnl >= 0 ? "default" : "destructive"} className="ml-2">
              P&L: ${currentPosition.unrealizedPnl.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to start trading
            </p>
            <Button onClick={connect} className="w-full">
              Connect Wallet
            </Button>
          </div>
        ) : (
          <>
            {/* Position Summary */}
            {(yesPosition || noPosition) && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <h4 className="font-semibold text-sm mb-2">Current Positions</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {yesPosition && (
                    <div className="flex justify-between">
                      <span>YES:</span>
                      <span className="font-mono">{yesPosition.quantity}</span>
                    </div>
                  )}
                  {noPosition && (
                    <div className="flex justify-between">
                      <span>NO:</span>
                      <span className="font-mono">{noPosition.quantity}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Smart Contract Toggle */}
            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Label htmlFor="smart-contract-toggle" className="cursor-pointer">
                  Smart Contract Execution
                </Label>
                <Badge variant={useSmartContract ? "default" : "secondary"} className="text-xs">
                  {useSmartContract ? "ON" : "OFF"}
                </Badge>
              </div>
              <input
                id="smart-contract-toggle"
                type="checkbox"
                checked={useSmartContract}
                onChange={(e) => setUseSmartContract(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Order Form */}
            <Tabs value={side} onValueChange={(value) => setSide(value as 'BUY' | 'SELL')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="BUY" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy
                </TabsTrigger>
                <TabsTrigger value="SELL" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value={side} className="space-y-4">
                {/* Order Type */}
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={(value: 'LIMIT' | 'MARKET') => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIMIT">Limit Order</SelectItem>
                      <SelectItem value="MARKET" disabled>Market Order (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Input */}
                <div className="space-y-2">
                  <Label>Price (¢)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0.01"
                    max="0.99"
                    step="0.01"
                  />
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>

                {/* Time in Force */}
                <div className="space-y-2">
                  <Label>Time in Force</Label>
                  <Select value={timeInForce} onValueChange={(value: 'GTC' | 'IOC' | 'FOK') => setTimeInForce(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                      <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                      <SelectItem value="FOK">Fill or Kill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Summary */}
                {price && quantity && (
                  <div className="border rounded-lg p-3 bg-muted/30 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-mono">
                        ${(parseFloat(price) * parseInt(quantity)).toFixed(2)}
                      </span>
                    </div>
                    {useSmartContract && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Execution:</span>
                        <span>On-Chain (Hedera Smart Contract)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!price || !quantity || submitOrderMutation.isPending}
                  className={cn(
                    "w-full",
                    side === 'BUY' ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"
                  )}
                >
                  {submitOrderMutation.isPending 
                    ? useSmartContract 
                      ? 'Signing Transaction...' 
                      : 'Submitting...' 
                    : `${side} ${quantity || '0'} shares`
                  }
                </Button>
                
                {useSmartContract && (
                  <p className="text-xs text-center text-muted-foreground">
                    You'll be asked to sign the transaction in your wallet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CLOBTradingInterface;