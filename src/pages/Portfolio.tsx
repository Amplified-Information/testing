import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Layout/Header";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface PredictionPosition {
  id: string;
  marketQuestion: string;
  position: 'YES' | 'NO';
  currentPrice: number;
  entryPrice: number;
  entryDate: string;
  contracts: number;
  category: string;
  resolutionDate: string;
  status: 'active' | 'resolved' | 'closing_soon';
}

const mockPositions: PredictionPosition[] = [
  {
    id: "1",
    marketQuestion: "Will Bitcoin reach $100,000 by end of 2024?",
    position: "YES",
    currentPrice: 0.72,
    entryPrice: 0.65,
    entryDate: "2024-01-15",
    contracts: 100,
    category: "Cryptocurrency",
    resolutionDate: "2024-12-31",
    status: "active"
  },
  {
    id: "2",
    marketQuestion: "Will Democrats win the 2024 Presidential Election?",
    position: "YES", 
    currentPrice: 0.58,
    entryPrice: 0.62,
    entryDate: "2024-02-10",
    contracts: 75,
    category: "Politics",
    resolutionDate: "2024-11-05",
    status: "closing_soon"
  },
  {
    id: "3",
    marketQuestion: "Will Tesla stock reach $300 by Q4 2024?",
    position: "NO",
    currentPrice: 0.38,
    entryPrice: 0.45,
    entryDate: "2024-03-05",
    contracts: 50,
    category: "Stock Market",
    resolutionDate: "2024-12-31",
    status: "active"
  },
  {
    id: "4",
    marketQuestion: "Will OpenAI release GPT-5 in 2024?",
    position: "YES",
    currentPrice: 0.43,
    entryPrice: 0.35,
    entryDate: "2024-01-20",
    contracts: 120,
    category: "Technology",
    resolutionDate: "2024-12-31", 
    status: "active"
  },
  {
    id: "5",
    marketQuestion: "Will the Fed cut interest rates by 0.5% in 2024?",
    position: "NO",
    currentPrice: 0.25,
    entryPrice: 0.40,
    entryDate: "2023-12-01",
    contracts: 200,
    category: "Finance",
    resolutionDate: "2024-12-31",
    status: "active"
  }
];

const Portfolio = () => {
  const totalValue = mockPositions.reduce((sum, position) => sum + (position.currentPrice * position.contracts), 0);
  const totalCost = mockPositions.reduce((sum, position) => sum + (position.entryPrice * position.contracts), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = ((totalGainLoss / totalCost) * 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track your event prediction market positions and performance</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totalGainLoss)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return %</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions List */}
        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <CardDescription>Your current event prediction market positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPositions.map((position) => {
                const currentValue = position.currentPrice * position.contracts;
                const costBasis = position.entryPrice * position.contracts;
                const gainLoss = currentValue - costBasis;
                const changePercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
                
                return (
                  <div key={position.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={position.position === 'YES' ? 'default' : 'secondary'} className="text-xs">
                              {position.position}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {position.contracts} contracts
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {position.category}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{position.marketQuestion}</h3>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Entered: {formatDate(position.entryDate)}</span>
                            <span>Resolves: {formatDate(position.resolutionDate)}</span>
                            <Badge 
                              variant={position.status === 'closing_soon' ? 'destructive' : 'outline'} 
                              className="text-xs"
                            >
                              {position.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold">{formatCurrency(position.currentPrice)}</span>
                          <Badge variant={changePercent >= 0 ? "default" : "destructive"} className="text-xs">
                            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Value: {formatCurrency(currentValue)}
                        </p>
                        <p className={`text-sm font-medium ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Entry: {formatCurrency(position.entryPrice)} × {position.contracts}</span>
                        <span>Current: {formatCurrency(position.currentPrice)} × {position.contracts}</span>
                      </div>
                      <Progress 
                        value={changePercent >= 0 ? Math.min(100, Math.abs(changePercent) * 2) : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Portfolio;