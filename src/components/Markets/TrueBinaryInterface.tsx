import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BinaryOption {
  id: string;
  option_name: string;
  option_type: 'yes' | 'no';
  current_price: number;
  total_shares?: number;
}

interface TrueBinaryInterfaceProps {
  yesOption: BinaryOption;
  noOption: BinaryOption;
}

const TrueBinaryInterface = ({ yesOption, noOption }: TrueBinaryInterfaceProps) => {
  const yesPercentage = Math.round(yesOption.current_price * 100);
  const noPercentage = Math.round(noOption.current_price * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Binary Outcome</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-6 rounded-lg border bg-card/50">
          {/* Left side - Outcome percentages */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{yesPercentage}%</div>
              <div className="text-sm text-muted-foreground">Yes</div>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">{noPercentage}%</div>
              <div className="text-sm text-muted-foreground">No</div>
            </div>
          </div>
          
          {/* Right side - Trading buttons */}
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
              Yes {yesPercentage}¢
            </Button>
            <Button variant="destructive" size="lg">
              No {noPercentage}¢
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrueBinaryInterface;