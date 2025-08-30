import Header from "@/components/Layout/Header";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioSummaryCard } from "@/components/Portfolio/PortfolioSummary";
import { PortfolioHoldings } from "@/components/Portfolio/PortfolioHoldings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Portfolio = () => {
  const { holdings, summary, loading, error } = usePortfolio();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
            <p className="text-muted-foreground">Track your event prediction market positions and performance</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
            <p className="text-muted-foreground">Track your event prediction market positions and performance</p>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load portfolio data: {error}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">Track your event prediction market positions and performance</p>
        </div>
        
        <PortfolioSummaryCard summary={summary} />
        
        {holdings.length > 0 ? (
          <PortfolioHoldings holdings={holdings} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No positions found. Start trading on some markets to build your portfolio!
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default Portfolio;