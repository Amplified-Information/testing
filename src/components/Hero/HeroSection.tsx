import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, DollarSign, Users, BarChart3, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-bg.jpg";
import { useMarketStats } from "@/hooks/useMarketStats";

const HeroSection = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { stats: marketStats, loading, error } = useMarketStats();
  
  const stats = [
    { label: "Total Volume", value: loading ? "..." : marketStats.totalVolume, icon: DollarSign },
    { label: "Active Event Prediction Markets", value: loading ? "..." : marketStats.activeMarkets.toString(), icon: BarChart3 },
    { label: "Traders", value: loading ? "..." : marketStats.totalTraders, icon: Users },
    { label: "24h Volume", value: loading ? "..." : marketStats.volume24h, icon: TrendingUp },
  ];

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
        
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="relative container py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                    Predict the Future,
                    <span className="block text-transparent bg-gradient-to-r from-primary to-primary-glow bg-clip-text">
                      Trade with Confidence
                    </span>
                  </h1>
                  
                     <p className="text-xl text-muted-foreground max-w-lg">
                      Trade on real-world events using Hedera Hashgraph. A decentralized prediction protocol for the next generation of Web3 users.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="trading" size="xl">
                    Start Trading
                  </Button>
                  <Button variant="outline" size="xl" asChild>
                    <Link to="/markets">
                      Explore Event Prediction Markets
                    </Link>
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span>Not Yet Live on Hedera Testnet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-up rounded-full" />
                    <span>Instant Settlements</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <stat.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
      
      {/* Collapse/Expand Button - positioned to be visible in both states */}
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={`fixed top-6 left-6 z-50 bg-primary/10 backdrop-blur-sm hover:bg-primary/20 border-primary/30 shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-3 ${
            !isExpanded ? 'top-24' : ''
          }`}
        >
          {isExpanded ? (
            <ChevronUp className="h-6 w-6 text-primary" />
          ) : (
            <ChevronDown className="h-6 w-6 text-primary" />
          )}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
};

export default HeroSection;