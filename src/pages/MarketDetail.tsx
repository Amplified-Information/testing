import { useParams } from "react-router-dom";
import Header from "@/components/Layout/Header";
import BinaryMarketDetailPage from "./BinaryMarketDetailPage";
import MultiChoiceMarketDetailPage from "./MultiChoiceMarketDetailPage";
import TradingInterface from "@/components/Markets/TradingInterface";
import CandidateList from "@/components/Markets/CandidateList";
import MarketHeader from "@/components/Markets/MarketHeader";
import MarketChart from "@/components/Markets/MarketChart";
import CLOBTradingInterface from "@/components/CLOB/CLOBTradingInterface";
import OrderBookDisplay from "@/components/CLOB/OrderBookDisplay";
import OrderHistoryTable from "@/components/CLOB/OrderHistoryTable";
import { useMarketDetail } from "@/hooks/useMarketDetail";
import { useMarketType } from "@/hooks/useMarketType";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketDetail = () => {
  const { id } = useParams();
  const { wallet } = useWallet();
  const { market, loading, error } = useMarketDetail(id || '');
  const { marketType, isBinary, isMultiChoice, isTraditional } = useMarketType(market);

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

  // Route to appropriate market detail page based on type
  if (isBinary) {
    return <BinaryMarketDetailPage market={market} />;
  }

  if (isMultiChoice) {
    return <MultiChoiceMarketDetailPage market={market} />;
  }

  // Fallback for traditional markets
  const candidates = market.options?.map(option => ({
    id: option.id,
    name: option.option_name,
    party: option.option_type === 'yes' ? 'Yes' : option.option_type === 'no' ? 'No' : option.option_name,
    percentage: Math.round(option.current_price * 100),
    yesPrice: Math.round(option.current_price * 100),
    noPrice: Math.round((1 - option.current_price) * 100),
    change24h: 0,
    avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <MarketHeader 
              question={market.name}
              category={market.category}
              subcategory={market.subcategory}
              volume={market.volume}
              endDate={market.end_date}
              description={market.description}
            />
            
            {market.chartData && market.chartData.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <MarketChart 
                  data={market.chartData}
                  candidates={candidates}
                />
              </div>
            )}
            
            <CandidateList candidates={candidates} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Tabs defaultValue="clob" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="clob">CLOB Trading</TabsTrigger>
                  <TabsTrigger value="traditional">Traditional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clob" className="space-y-4">
                  <CLOBTradingInterface marketId={market.id} />
                  <OrderBookDisplay marketId={market.id} />
                </TabsContent>
                
                <TabsContent value="traditional">
                  {candidates[0] ? (
                    <TradingInterface 
                      topCandidate={candidates[0]}
                      marketId={market.id}
                    />
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No candidate data available
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {wallet.accountId && (
                <OrderHistoryTable 
                  marketId={market.id}
                  accountId={wallet.accountId}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketDetail;