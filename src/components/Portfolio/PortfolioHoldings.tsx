import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PortfolioHolding } from "@/hooks/usePortfolio";

interface PortfolioHoldingsProps {
  holdings: PortfolioHolding[];
}

export const PortfolioHoldings = ({ holdings }: PortfolioHoldingsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell className="max-w-xs">
                    <div className="truncate font-medium">
                      {holding.marketName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={holding.position === 'YES' ? 'default' : 'secondary'}
                      className={holding.position === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {holding.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {holding.shares.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${holding.avgPrice.toFixed(3)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                      ${holding.currentPrice.toFixed(3)}
                      {holding.change24h !== 0 && (
                        <div className={`flex items-center ${holding.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span className="text-xs ml-1">
                            {Math.abs(holding.change24h).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(holding.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`font-mono ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(holding.unrealizedPnL)}
                      <div className="text-xs">
                        {formatPercent(holding.unrealizedPnLPercent)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDate(holding.endDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};