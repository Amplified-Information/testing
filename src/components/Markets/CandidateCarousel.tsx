import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface CandidateOption {
  id: string;
  name: string;
  avatar?: string;
  party?: string;
  yesPrice: number;
  noPrice: number;
  yesOptionId: string;
  noOptionId: string;
  volume24h: number;
  change24h: number;
  totalShares: number;
}

interface CandidateCarouselProps {
  candidates: CandidateOption[];
  maxVisible?: number;
  showPrices?: boolean;
  onCandidateClick?: (candidate: CandidateOption) => void;
}

const CandidateCarousel = ({ 
  candidates, 
  maxVisible = 3, 
  showPrices = true,
  onCandidateClick 
}: CandidateCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const visibleCandidates = candidates.slice(currentIndex, currentIndex + maxVisible);
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

  if (candidates.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No candidates available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Carousel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Top Candidates
          </span>
          <div className="text-xs bg-muted px-2 py-1 rounded-full">
            {candidates.length} total
          </div>
        </div>
        
        {/* Navigation Controls */}
        {candidates.length > maxVisible && (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={scrollRight}
              disabled={!canScrollRight}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Candidates Display */}
      <div className="grid grid-cols-1 gap-2">
        {visibleCandidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
              index === 0 && "ring-2 ring-primary/20" // Highlight leader
            )}
            onClick={() => onCandidateClick?.(candidate)}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 text-center">
              <span className={cn(
                "text-sm font-medium",
                index === 0 ? "text-primary" : "text-muted-foreground"
              )}>
                #{currentIndex + index + 1}
              </span>
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={candidate.avatar} alt={candidate.name} />
              <AvatarFallback className="text-xs">
                {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Candidate Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{candidate.name}</p>
                {candidate.party && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {candidate.party}
                  </span>
                )}
              </div>
            </div>

            {/* Price Info */}
            {showPrices && (
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-medium">
                  ${candidate.yesPrice.toFixed(2)}
                </div>
                <div className={cn(
                  "text-xs flex items-center gap-1",
                  candidate.change24h >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {candidate.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(candidate.change24h).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {candidates.length > maxVisible && (
        <div className="flex justify-center gap-1 pt-2">
          {Array.from({ length: Math.ceil(candidates.length / maxVisible) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * maxVisible)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                Math.floor(currentIndex / maxVisible) === i 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateCarousel;