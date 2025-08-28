import { useParams } from "react-router-dom";
import Header from "@/components/Layout/Header";
import MarketChart from "@/components/Markets/MarketChart";
import TradingInterface from "@/components/Markets/TradingInterface";
import CandidateList from "@/components/Markets/CandidateList";
import MarketHeader from "@/components/Markets/MarketHeader";

// Mock data for demonstration
const mockMarketData = {
  id: "us-presidential-election-2028",
  question: "Next US Presidential Election Winner?",
  category: "Politics",
  volume: 1646084,
  endDate: "2028-11-07",
  description: "This market will resolve to the winner of the 2028 US Presidential Election.",
  candidates: [
    {
      id: "jd-vance",
      name: "J.D. Vance",
      party: "Republican",
      percentage: 30,
      yesPrice: 30,
      noPrice: 70,
      change24h: 2,
      avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
    },
    {
      id: "gavin-newsom", 
      name: "Gavin Newsom",
      party: "Democratic",
      percentage: 15,
      yesPrice: 17,
      noPrice: 85,
      change24h: -2,
      avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
    },
    {
      id: "alexandria-ocasio-cortez",
      name: "Alexandria Ocasio-Cortez", 
      party: "Democratic",
      percentage: 6,
      yesPrice: 8,
      noPrice: 94,
      change24h: -1,
      avatar: "/lovable-uploads/40f8cf08-e4b9-4a6e-81f6-677ca39c5d26.png"
    }
  ],
  chartData: [
    { date: "2024-05", "J.D. Vance": 25, "Gavin Newsom": 12, "Alexandria Ocasio-Cortez": 8 },
    { date: "2024-06", "J.D. Vance": 27, "Gavin Newsom": 13, "Alexandria Ocasio-Cortez": 7 },
    { date: "2024-07", "J.D. Vance": 29, "Gavin Newsom": 14, "Alexandria Ocasio-Cortez": 6 },
    { date: "2024-08", "J.D. Vance": 30, "Gavin Newsom": 15, "Alexandria Ocasio-Cortez": 6 }
  ]
};

const MarketDetail = () => {
  const { id } = useParams();
  
  // In a real app, you'd fetch market data based on the ID
  const market = mockMarketData;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <MarketHeader 
              question={market.question}
              category={market.category}
              volume={market.volume}
              endDate={market.endDate}
              description={market.description}
            />
            
            <div className="bg-card rounded-lg border p-6">
              <MarketChart 
                data={market.chartData}
                candidates={market.candidates}
              />
            </div>
            
            <CandidateList candidates={market.candidates} />
          </div>

          {/* Trading sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TradingInterface 
                topCandidate={market.candidates[0]}
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