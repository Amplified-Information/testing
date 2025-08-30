import { Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/markets">Markets</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/markets?category=${encodeURIComponent(category)}`}>{category}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{question}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Clock className="mr-1 h-4 w-4" />
            Ends {new Date(endDate).toLocaleDateString()}
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