import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Volume2, Droplet, Users, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import CandidateCarousel, { type CandidateOption } from "./CandidateCarousel";
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
  liquidity
}: MultiChoiceMarketCardProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxVisible = 3;

  const handleCardClick = () => {
    navigate(`/market/${id}`);
  };

  const handleCandidateClick = (candidate: CandidateOption) => {
    // Navigate to market with candidate pre-selected
    navigate(`/market/${id}?candidate=${candidate.id}`);
  };

  const timeToEnd = formatDistanceToNow(new Date(endDate), { addSuffix: true });
  
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + maxVisible < candidates.length;
  
  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };
  
  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(Math.min(candidates.length - maxVisible, currentIndex + 1));
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group" style={{background: 'var(--gradient-card)'}}>
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Category and Market Type Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium"
              >
                {category}
              </Badge>
              <Badge 
                variant="outline" 
                className="text-xs border-primary/20 text-primary"
              >
                <Users className="h-3 w-3 mr-1" />
                Multi-Choice
              </Badge>
            </div>
            
            {/* End Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Ends {timeToEnd}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {question}
        </h3>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Candidates Carousel */}
        <CandidateCarousel
          candidates={candidates}
          maxVisible={maxVisible}
          currentIndex={currentIndex}
          showPrices={true}
          showControls={false}
          onCandidateClick={handleCandidateClick}
        />

        {/* Market Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              <span>${volume.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplet className="h-3 w-3" />
              <span>${liquidity.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Carousel Navigation */}
            {candidates.length > maxVisible && (
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollLeft();
                  }}
                  disabled={!canScrollLeft}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollRight();
                  }}
                  disabled={!canScrollRight}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* View Market Button */}
            <Button 
              size="sm" 
              className="h-7 text-xs px-3"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Market
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiChoiceMarketCard;