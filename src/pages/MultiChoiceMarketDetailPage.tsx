import Header from "@/components/Layout/Header";
import MarketChart from "@/components/Markets/MarketChart";
import MarketHeader from "@/components/Markets/MarketHeader";
import MultiChoiceTradingInterface from "@/components/Markets/MultiChoiceTradingInterface";
import CLOBTradingInterface from "@/components/CLOB/CLOBTradingInterface";
import OrderBookDisplay from "@/components/CLOB/OrderBookDisplay";
import OrderHistoryTable from "@/components/CLOB/OrderHistoryTable";
import { useMultiChoiceMarket } from "@/hooks/useMultiChoiceMarket";
import { useWallet } from "@/contexts/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketDetail } from "@/hooks/useMarketDetail";

interface MultiChoiceMarketDetailPageProps {
  market: MarketDetail;
}

const MultiChoiceMarketDetailPage = ({ market }: MultiChoiceMarketDetailPageProps) => {
  const { wallet } = useWallet();
  const { 
    candidateGroups, 
    binaryCandidates,
    loading: multiChoiceLoading 
  } = useMultiChoiceMarket(market.id);

  if (multiChoiceLoading) {
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
              subcategory={market.subcategory}
              volume={market.volume}
              endDate={market.end_date}
              description={market.description}
            />
            
            {market.chartData && market.chartData.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <MarketChart 
                  data={market.chartData}
                  candidates={binaryCandidates}
                />
              </div>
            )}
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Candidates</h2>
              <div className="grid gap-4">
                {candidateGroups.map((group) => (
                  <div key={group.candidate.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <img 
                        src={group.candidate.avatar || '/placeholder.svg'} 
                        alt={group.candidate.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold">{group.candidate.name}</h4>
                        {group.candidate.party && (
                          <span className="text-sm text-muted-foreground">{group.candidate.party}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(group.candidate.yesPrice * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {group.candidate.change24h >= 0 ? '+' : ''}{group.candidate.change24h.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                          Yes {Math.round(group.candidate.yesPrice * 100)}¢
                        </button>
                        <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90">
                          No {Math.round(group.candidate.noPrice * 100)}¢
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                  <MultiChoiceTradingInterface 
                    candidates={candidateGroups.map(g => g.candidate)}
                    marketId={market.id} 
                  />
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

export default MultiChoiceMarketDetailPage;