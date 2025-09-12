import { useMemo } from "react";
import Header from "@/components/Layout/Header";
import BinaryMarketChart from "@/components/Markets/BinaryMarketChart";
import MarketHeader from "@/components/Markets/MarketHeader";
import MarketRules from "@/components/Markets/MarketRules";
import MarketResolution from "@/components/Markets/MarketResolution";
import DiscussionBoard from "@/components/Markets/DiscussionBoard";
import BinaryMarketInterface from "@/components/Markets/BinaryMarketInterface";
import BinaryTradingInterface from "@/components/Markets/BinaryTradingInterface";
import CLOBTradingInterface from "@/components/CLOB/CLOBTradingInterface";
import OrderBookDisplay from "@/components/CLOB/OrderBookDisplay";
import OrderHistoryTable from "@/components/CLOB/OrderHistoryTable";
import { useWallet } from "@/contexts/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MarketDetail } from "@/hooks/useMarketDetail";

interface BinaryMarketDetailPageProps {
  market: MarketDetail;
}

const BinaryMarketDetailPage = ({ market }: BinaryMarketDetailPageProps) => {
  const { wallet } = useWallet();

  // Get binary options
  const binaryOptions = useMemo(() => {
    if (!market?.options) return { yesOption: null, noOption: null };
    
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
  }, [market]);

  if (!binaryOptions.yesOption || !binaryOptions.noOption) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            Invalid binary market configuration
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
            
            {/* Buy Buttons */}
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-center gap-4">
                <button className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <div className="text-center">
                    <div className="text-lg font-semibold">YES</div>
                    <div className="text-2xl font-bold">{Math.round(binaryOptions.yesOption.current_price * 100)}¢</div>
                  </div>
                </button>
                <button className="flex-1 px-6 py-4 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
                  <div className="text-center">
                    <div className="text-lg font-semibold">NO</div>
                    <div className="text-2xl font-bold">{Math.round(binaryOptions.noOption.current_price * 100)}¢</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Price History Chart */}
            <BinaryMarketChart
              data={market.chartData || []}
              yesPrice={binaryOptions.yesOption.current_price}
              noPrice={binaryOptions.noOption.current_price}
              volume={market.volume}
            />

            {/* Market Rules */}
            <MarketRules
              marketId={market.id}
              endDate={market.end_date}
              minimumBet={1}
              maximumBet={undefined}
              category={market.category}
              subcategory={market.subcategory}
            />

            {/* Market Resolution */}
            <MarketResolution
              status="open"
              endDate={market.end_date}
              resolutionDate={undefined}
              resolutionNotes={undefined}
              resolutionValue={undefined}
              oracleType="Manual"
            />

            {/* Discussion Board */}
            <DiscussionBoard marketId={market.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Order Book */}
              <OrderBookDisplay marketId={market.id} />

              {/* Trading Interface */}
              <Tabs defaultValue="clob" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="clob">CLOB Trading</TabsTrigger>
                  <TabsTrigger value="traditional">Traditional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clob" className="space-y-4">
                  <CLOBTradingInterface marketId={market.id} />
                </TabsContent>
                
                <TabsContent value="traditional">
                  <BinaryTradingInterface 
                    yesOption={binaryOptions.yesOption}
                    noOption={binaryOptions.noOption}
                    marketId={market.id} 
                  />
                </TabsContent>
              </Tabs>
              
              {/* Order History */}
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

export default BinaryMarketDetailPage;