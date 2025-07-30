import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

interface MarketCardProps {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  liquidity: number;
  change24h: number;
}

const MarketCard = ({ 
  question, 
  category, 
  yesPrice, 
  noPrice, 
  volume, 
  endDate, 
  liquidity,
  change24h 
}: MarketCardProps) => {
  const yesPercentage = (yesPrice / (yesPrice + noPrice)) * 100;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="mb-2">
            {category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {endDate}
          </div>
        </div>
        <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {question}
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-yes font-medium">YES {yesPrice}¢</span>
            <span className="text-no font-medium">NO {noPrice}¢</span>
          </div>
          <Progress value={yesPercentage} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Volume:</span>
            <span className="ml-1 font-medium">${volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            {change24h >= 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-up" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-down" />
            )}
            <span className={`font-medium ${change24h >= 0 ? 'text-up' : 'text-down'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="yes" size="sm" className="w-full">
            Buy YES
          </Button>
          <Button variant="no" size="sm" className="w-full">
            Buy NO
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;