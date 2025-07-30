import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, SortAsc } from "lucide-react";
import MarketCard from "./MarketCard";

// Mock data
const mockMarkets = [
  {
    id: "1",
    question: "Will Bitcoin reach $100,000 by end of 2024?",
    category: "Crypto",
    yesPrice: 65,
    noPrice: 35,
    volume: 125000,
    endDate: "Dec 31, 2024",
    liquidity: 50000,
    change24h: 2.3
  },
  {
    id: "2", 
    question: "Will the next US Federal Reserve rate decision be a cut?",
    category: "Economics",
    yesPrice: 78,
    noPrice: 22,
    volume: 89000,
    endDate: "Nov 15, 2024",
    liquidity: 35000,
    change24h: -1.2
  },
  {
    id: "3",
    question: "Will Hedera Hashgraph partnership with a Fortune 500 company be announced in Q4 2024?",
    category: "Technology",
    yesPrice: 42,
    noPrice: 58,
    volume: 45000,
    endDate: "Dec 31, 2024",
    liquidity: 28000,
    change24h: 5.7
  },
  {
    id: "4",
    question: "Will global temperature rise exceed 1.5°C by 2025?",
    category: "Climate",
    yesPrice: 85,
    noPrice: 15,
    volume: 67000,
    endDate: "Dec 31, 2025",
    liquidity: 40000,
    change24h: 0.8
  }
];

const MarketsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("volume");

  const categories = ["all", "Crypto", "Economics", "Technology", "Climate", "Sports", "Politics"];

  const filteredMarkets = mockMarkets
    .filter(market => 
      market.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || market.category === selectedCategory)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "volume":
          return b.volume - a.volume;
        case "liquidity":
          return b.liquidity - a.liquidity;
        case "change":
          return b.change24h - a.change24h;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-muted/50"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SortAsc className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="liquidity">Liquidity</SelectItem>
            <SelectItem value="change">24h Change</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Market Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="ending-soon">Ending Soon</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="high-volume">High Volume</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} {...market} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ending-soon" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMarkets.slice(0, 3).map((market) => (
              <MarketCard key={market.id} {...market} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMarkets.slice(1, 4).map((market) => (
              <MarketCard key={market.id} {...market} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="high-volume" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMarkets.slice(0, 2).map((market) => (
              <MarketCard key={market.id} {...market} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredMarkets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No markets found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MarketsList;