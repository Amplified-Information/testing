import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MultiChoiceCandidate } from "@/types/market";

interface MultiChoiceMarketCardProps {
  id: string;
  question: string;
  category: string;
  candidates: MultiChoiceCandidate[];
  volume: number;
  endDate: string;
  liquidity: number;
}

const MultiChoiceMarketCard = ({
  id,
  question,
  category,
  candidates,
  volume,
  endDate,
  liquidity,
}: MultiChoiceMarketCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/market/${id}`);
  };

  const topCandidates = candidates.slice(0, 3); // Show top 3 candidates

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 text-xs">
              {category}
            </Badge>
            <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
              {question}
            </CardTitle>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {new Date(endDate).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Candidates */}
        <div className="space-y-2">
          {topCandidates.map((candidate) => (
            <div 
              key={candidate.id}
              className="flex items-center justify-between p-2 rounded-lg bg-card/50 border"
            >
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={candidate.avatar} />
                  <AvatarFallback className="text-xs">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{candidate.name}</div>
                  {candidate.party && (
                    <div className="text-xs text-muted-foreground">{candidate.party}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {Math.round(candidate.yesPrice * 100)}¢
                  </div>
                  <div className="flex items-center text-xs">
                    {candidate.change24h >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-up" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-down" />
                    )}
                    <span className={candidate.change24h >= 0 ? 'text-up' : 'text-down'}>
                      {candidate.change24h >= 0 ? '+' : ''}{candidate.change24h.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <Button
                  variant="yes"
                  size="sm"
                  className="min-w-[60px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Handle buy action
                  }}
                >
                  {Math.round(candidate.yesPrice * 100)}¢
                </Button>
              </div>
            </div>
          ))}
        </div>

        {candidates.length > 3 && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              +{candidates.length - 3} more candidates
            </Badge>
          </div>
        )}

        {/* Market Stats */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center">
            <DollarSign className="mr-1 h-3 w-3" />
            <span>Vol: ${volume.toLocaleString()}</span>
          </div>
          <div>
            Liquidity: ${liquidity.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiChoiceMarketCard;