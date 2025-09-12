import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, DollarSign, Scale } from "lucide-react";

interface MarketRulesProps {
  marketId: string;
  endDate: string;
  minimumBet?: number;
  maximumBet?: number;
  category?: string;
  subcategory?: string;
}

const MarketRules = ({ 
  marketId, 
  endDate, 
  minimumBet = 1, 
  maximumBet, 
  category = "Politics",
  subcategory = "Elections"
}: MarketRulesProps) => {
  const rules = [
    {
      icon: Clock,
      title: "Market Closes",
      description: `This market will close on ${new Date(endDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}`,
      type: "info"
    },
    {
      icon: DollarSign,
      title: "Betting Limits",
      description: `Minimum bet: $${minimumBet}${maximumBet ? ` • Maximum bet: $${maximumBet.toLocaleString()}` : ''}`,
      type: "info"
    },
    {
      icon: Scale,
      title: "Resolution Criteria",
      description: "This market will resolve based on official results and credible news sources. Resolution typically occurs within 24-48 hours of the outcome being determined.",
      type: "warning"
    },
    {
      icon: AlertCircle,
      title: "Important Notes",
      description: "All trades are final. Market may be resolved early if outcome becomes certain before the close date. Fees apply to winning positions.",
      type: "destructive"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Market Rules</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{category}</Badge>
            <Badge variant="outline">{subcategory}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card">
              <div className={`flex-shrink-0 p-2 rounded-full ${
                rule.type === 'info' ? 'bg-primary/10 text-primary' :
                rule.type === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                'bg-destructive/10 text-destructive'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium text-sm">{rule.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Market ID: {marketId} • Always read the full terms and conditions before participating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketRules;