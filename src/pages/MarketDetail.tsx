import { useParams } from "react-router-dom";
import { useMemo } from "react";
import Header from "@/components/Layout/Header";
import MarketChart from "@/components/Markets/MarketChart";
import TradingInterface from "@/components/Markets/TradingInterface";
import CandidateList from "@/components/Markets/CandidateList";
import MarketHeader from "@/components/Markets/MarketHeader";
import MultiChoiceTradingInterface from "@/components/Markets/MultiChoiceTradingInterface";
import BinaryMarketInterface from "@/components/Markets/BinaryMarketInterface";
import BinaryTradingInterface from "@/components/Markets/BinaryTradingInterface";
import CLOBTradingInterface from "@/components/CLOB/CLOBTradingInterface";
import OrderBookDisplay from "@/components/CLOB/OrderBookDisplay";
import OrderHistoryTable from "@/components/CLOB/OrderHistoryTable";
import { useMarketDetail } from "@/hooks/useMarketDetail";
import { useMultiChoiceMarket } from "@/hooks/useMultiChoiceMarket";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketDetail = () => {
  const { id } = useParams();
  const { wallet } = useWallet();
  const { market, loading, error } = useMarketDetail(id || '');
  const { 
    candidateGroups, 
    binaryCandidates, 
    isMultiChoice,
    loading: multiChoiceLoading 
  } = useMultiChoiceMarket(id || '');

  // Determine market type based on market structure and options
  const isTrueBinary = market?.market_structure === 'binary' || 
                      (market?.options && market.options.length === 2 && 
                       market.options.every(opt => ['yes', 'no'].includes(opt.option_type?.toLowerCase() || '')));

  // Transform options for multi-choice markets only
  const candidates = useMemo(() => {
    if (!market?.options || isTrueBinary) return [];
    
    if (isMultiChoice) {
      // For multi-candidate markets, use binaryCandidates from hook
      return binaryCandidates;
    } else {
      // Fallback transformation for other market types
      return market.options.map(option => ({
        id: option.id,
        name: option.option_name,
        party: option.option_type === 'yes' ? 'Yes' : option.option_type === 'no' ? 'No' : option.option_name,
        percentage: Math.round(option.current_price * 100),
        yesPrice: Math.round(option.current_price * 100),
        noPrice: Math.round((1 - option.current_price) * 100),
        change24h: 0, // TODO: Calculate from price history
        avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
      }));
    }
  }, [market, isMultiChoice, binaryCandidates, isTrueBinary]);

  // Get binary options for true binary markets
  const binaryOptions = useMemo(() => {
    if (!isTrueBinary || !market?.options) return { yesOption: null, noOption: null };
    
    const yesOption = market.options.find(opt => opt.option_type?.toLowerCase() === 'yes');
    const noOption = market.options.find(opt => opt.option_type?.toLowerCase() === 'no');
    
    return { 
      yesOption: yesOption ? {
        ...yesOption,
        option_type: 'yes' as const
      } : null, 
      noOption: noOption ? {
        ...noOption,
        option_type: 'no' as const
      } : null
    };
  }, [isTrueBinary, market]);

  // Early returns AFTER all hooks are called
  if (loading || multiChoiceLoading) {
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
            
            {market.chartData.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <MarketChart 
                  data={market.chartData}
                  candidates={isTrueBinary ? [] : candidates}
                />
              </div>
            )}
            
            {isTrueBinary && binaryOptions.yesOption && binaryOptions.noOption ? (
              <BinaryMarketInterface 
                yesOption={binaryOptions.yesOption}
                noOption={binaryOptions.noOption}
              />
            ) : isMultiChoice ? (
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
                          <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                            Yes {Math.round(group.candidate.yesPrice * 100)}¢
                          </button>
                          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            No {Math.round(group.candidate.noPrice * 100)}¢
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <CandidateList candidates={candidates} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* CLOB Trading Interface */}
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
                  {isTrueBinary && binaryOptions.yesOption && binaryOptions.noOption ? (
                    <BinaryTradingInterface 
                      yesOption={binaryOptions.yesOption}
                      noOption={binaryOptions.noOption}
                      marketId={market.id} 
                    />
                  ) : isMultiChoice ? (
                    <MultiChoiceTradingInterface 
                      candidates={candidateGroups.map(g => g.candidate)}
                      marketId={market.id} 
                    />
                  ) : (
                    candidates[0] ? (
                      <TradingInterface 
                        topCandidate={candidates[0]}
                        marketId={market.id}
                      />
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No candidate data available
                      </div>
                    )
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Order History for connected wallet */}
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