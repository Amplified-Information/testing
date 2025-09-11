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
        <CardTitle>Candidate Outcomes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single Binary Choice Row */}
        <div className="space-y-4">
          {/* Yes Choice */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">Y</span>
              </div>
              <div>
                <div className="font-semibold">Yes</div>
                <div className="text-sm text-muted-foreground">Yes</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{yesPercentage}%</div>
                <div className="text-sm text-muted-foreground">+0</div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  Yes {yesPercentage}¢
                </Button>
              </div>
            </div>
          </div>

          {/* No Choice */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-destructive-foreground font-semibold">N</span>
              </div>
              <div>
                <div className="font-semibold">No</div>
                <div className="text-sm text-muted-foreground">No</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{noPercentage}%</div>
                <div className="text-sm text-muted-foreground">+0</div>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm">
                  No {noPercentage}¢
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrueBinaryInterface;