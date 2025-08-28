import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Layout/Header";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface Holding {
  id: string;
  ticker: string;
  company_name: string;
  price: number;
  buy_price: number;
  buy_date: string;
  performance: number;
  change_percent: number;
  shares: number;
}

const mockHoldings: Holding[] = [
  {
    id: "1",
    ticker: "AAPL",
    company_name: "Apple Inc.",
    price: 185.50,
    buy_price: 150.00,
    buy_date: "2024-01-15",
    performance: 35.50,
    change_percent: 23.67,
    shares: 10
  },
  {
    id: "2", 
    ticker: "MSFT",
    company_name: "Microsoft Corporation",
    price: 420.25,
    buy_price: 380.00,
    buy_date: "2024-02-10",
    performance: 40.25,
    change_percent: 10.59,
    shares: 5
  },
  {
    id: "3",
    ticker: "GOOGL", 
    company_name: "Alphabet Inc.",
    price: 142.80,
    buy_price: 160.50,
    buy_date: "2024-03-05",
    performance: -17.70,
    change_percent: -11.03,
    shares: 8
  },
  {
    id: "4",
    ticker: "TSLA",
    company_name: "Tesla, Inc.",
    price: 225.40,
    buy_price: 200.00,
    buy_date: "2024-01-20",
    performance: 25.40,
    change_percent: 12.70,
    shares: 15
  },
  {
    id: "5",
    ticker: "NVDA",
    company_name: "NVIDIA Corporation", 
    price: 875.30,
    buy_price: 650.00,
    buy_date: "2023-12-01",
    performance: 225.30,
    change_percent: 34.66,
    shares: 3
  }
];

const Portfolio = () => {
  const totalValue = mockHoldings.reduce((sum, holding) => sum + (holding.price * holding.shares), 0);
  const totalCost = mockHoldings.reduce((sum, holding) => sum + (holding.buy_price * holding.shares), 0);
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
          <p className="text-muted-foreground">Track your investment performance and holdings</p>
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

        {/* Holdings List */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>Your current investment positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockHoldings.map((holding) => {
                const currentValue = holding.price * holding.shares;
                const costBasis = holding.buy_price * holding.shares;
                const gainLoss = currentValue - costBasis;
                
                return (
                  <div key={holding.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{holding.ticker}</h3>
                            <Badge variant="outline" className="text-xs">
                              {holding.shares} shares
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{holding.company_name}</p>
                          <p className="text-xs text-muted-foreground">Purchased: {formatDate(holding.buy_date)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold">{formatCurrency(holding.price)}</span>
                          <Badge variant={holding.change_percent >= 0 ? "default" : "destructive"} className="text-xs">
                            {holding.change_percent >= 0 ? '+' : ''}{holding.change_percent.toFixed(2)}%
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
                        <span>Cost Basis: {formatCurrency(holding.buy_price)} × {holding.shares}</span>
                        <span>Current: {formatCurrency(holding.price)} × {holding.shares}</span>
                      </div>
                      <Progress 
                        value={holding.change_percent >= 0 ? Math.min(100, Math.abs(holding.change_percent) * 2) : 0}
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