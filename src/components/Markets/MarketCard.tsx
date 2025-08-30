import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MarketOption } from "@/types/market";

interface MarketCardProps {
  id: string;
  question: string;
  category: string;
  yesPrice?: number;
  noPrice?: number;
  volume: number;
  endDate: string;
  liquidity: number;
  change24h: number;
  marketType?: string;
  options?: MarketOption[];
}

const MarketCard = ({ 
  id,
  question, 
  category, 
  yesPrice, 
  noPrice, 
  volume, 
  endDate, 
  liquidity,
  change24h,
  marketType,
  options = []
}: MarketCardProps) => {
  const navigate = useNavigate();
  
  // Detect if this is a multi-candidate market
  const isMultiChoice = marketType === 'multi_choice' || options.length > 2;
  
  // Process candidates for multi-choice markets
  const candidates = isMultiChoice ? 
    options
      .filter(option => option.option_type === 'yes')
      .sort((a, b) => b.current_price - a.current_price)
      .slice(0, 3)
      .map(option => ({
        id: option.id,
        name: option.candidate_name || option.option_name,
        avatar: option.candidate_avatar || '/api/placeholder/32/32',
        party: option.candidate_party || '',
        price: Math.round(option.current_price * 100),
        change24h: 0 // Would need to be calculated from price history
      })) : [];

  const yesPercentage = yesPrice && noPrice ? (yesPrice / (yesPrice + noPrice)) * 100 : 0;
  
  const handleCardClick = () => {
    navigate(`/market/${id}`);
  };
  
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/50 border-border/50 cursor-pointer"
      onClick={handleCardClick}
    >
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
        {/* Display candidates for multi-choice markets */}
        {isMultiChoice ? (
          <div className="space-y-3">
            {/* Top candidates */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">Top Candidates</div>
              {candidates.slice(0, 3).map((candidate, index) => (
                <div key={candidate.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground w-4">#{index + 1}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={candidate.avatar} alt={candidate.name} />
                      <AvatarFallback className="text-xs">
                        {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium line-clamp-1">{candidate.name}</span>
                      {candidate.party && (
                        <span className="text-xs text-muted-foreground">{candidate.party}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{candidate.price}¢</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Binary market display */
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yes font-medium">YES {yesPrice}¢</span>
              <span className="text-no font-medium">NO {noPrice}¢</span>
            </div>
            <Progress value={yesPercentage} className="h-2" />
          </div>
        )}

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
        {isMultiChoice ? (
          <Button 
            variant="trading" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/market/${id}`);
            }}
          >
            View Market
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              variant="yes" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                // Handle buy yes action
              }}
            >
              Buy YES
            </Button>
            <Button 
              variant="no" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                // Handle buy no action
              }}
            >
              Buy NO
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketCard;