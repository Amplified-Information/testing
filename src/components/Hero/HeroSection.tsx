import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, BarChart3, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMarketStats } from "@/hooks/useMarketStats";

const HeroSection = () => {
  const navigate = useNavigate();
  const {
    stats: marketStats,
    loading,
    error
  } = useMarketStats();
  const stats = [{
    label: "Total Volume",
    value: loading ? "..." : marketStats.totalVolume,
    icon: DollarSign
  }, {
    label: "Active Event Prediction Markets",
    value: loading ? "..." : marketStats.activeMarkets.toString(),
    icon: BarChart3
  }, {
    label: "Traders",
    value: loading ? "..." : marketStats.totalTraders,
    icon: Users
  }, {
    label: "24h Volume",
    value: loading ? "..." : marketStats.volume24h,
    icon: TrendingUp
  }];
  return <div className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
      
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
              <Button variant="trading" size="xl" onClick={() => navigate('/markets')} className="text-slate-50">
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
                <span>Live on Hedera Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-up rounded-full" />
                <span>Instant Settlements</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/50">
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
              </Card>)}
          </div>
        </div>
      </div>
    </div>;
};
export default HeroSection;