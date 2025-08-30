import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface MarketHeaderProps {
  question: string;
  category: string;
  volume: number;
  endDate: string;
  description: string;
}

const MarketHeader = ({ question, category, volume, endDate, description }: MarketHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Link to={`/markets?category=${encodeURIComponent(category)}`}>
              <Badge variant="outline" className="hover:bg-accent cursor-pointer">{category}</Badge>
            </Link>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              Ends {new Date(endDate).toLocaleDateString()}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{question}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center">
          <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Volume:</span>
          <span className="ml-1 font-medium">${volume.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketHeader;