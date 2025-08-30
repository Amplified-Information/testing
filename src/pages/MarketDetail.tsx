import { useParams } from "react-router-dom";
import Header from "@/components/Layout/Header";
import MarketChart from "@/components/Markets/MarketChart";
import TradingInterface from "@/components/Markets/TradingInterface";
import CandidateList from "@/components/Markets/CandidateList";
import MarketHeader from "@/components/Markets/MarketHeader";
import { useMarketDetail } from "@/hooks/useMarketDetail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const MarketDetail = () => {
  const { id } = useParams();
  const { market, loading, error } = useMarketDetail(id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert>
            <AlertDescription>
              {error || 'Market not found'}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Transform options to candidates format for existing components
  const candidates = market.options.map(option => ({
    id: option.id,
    name: option.option_name,
    party: option.option_type === 'yes' ? 'Yes' : option.option_type === 'no' ? 'No' : option.option_name,
    percentage: Math.round(option.current_price * 100),
    yesPrice: Math.round(option.current_price * 100),
    noPrice: Math.round((1 - option.current_price) * 100),
    change24h: 0, // TODO: Calculate from price history
    avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <MarketHeader 
              question={market.name}
              category={market.category}
              volume={market.volume}
              endDate={market.end_date}
              description={market.description}
            />
            
            {market.chartData.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <MarketChart 
                  data={market.chartData}
                  candidates={candidates}
                />
              </div>
            )}
            
            <CandidateList candidates={candidates} />
          </div>

          {/* Trading sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TradingInterface 
                topCandidate={candidates[0]}
                marketId={market.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketDetail;