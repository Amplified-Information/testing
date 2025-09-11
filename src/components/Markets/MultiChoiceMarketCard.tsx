import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Clock, DollarSign, Trophy } from "lucide-react";
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
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 border-border/50 hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 text-xs font-medium">
              {category}
            </Badge>
            <CardTitle className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {question}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              {new Date(endDate).toLocaleDateString()}
            </div>
            <Badge variant="secondary" className="text-xs">
              {candidates.length} candidates
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Candidates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Leading Candidates</span>
          </div>
          {topCandidates.map((candidate, index) => (
            <div 
              key={candidate.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-primary w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    #{index + 1}
                  </span>
                </div>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={candidate.avatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{candidate.name}</div>
                  {candidate.party && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {candidate.party}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(candidate.yesPrice * 100)}¢
                  </div>
                  <div className="flex items-center text-xs justify-center">
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
                  className="min-w-[65px] font-bold shadow-sm hover:shadow-md transition-shadow"
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