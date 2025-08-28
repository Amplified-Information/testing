import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Candidate {
  id: string;
  name: string;
  party: string;
  percentage: number;
}

interface MarketChartProps {
  data: any[];
  candidates: Candidate[];
}

const chartColors = {
  "J.D. Vance": "hsl(var(--primary))",
  "Gavin Newsom": "hsl(220, 70%, 50%)", 
  "Alexandria Ocasio-Cortez": "hsl(280, 70%, 50%)"
};

const chartConfig = {
  "J.D. Vance": {
    label: "J.D. Vance",
    color: "hsl(var(--primary))",
  },
  "Gavin Newsom": {
    label: "Gavin Newsom", 
    color: "hsl(220, 70%, 50%)",
  },
  "Alexandria Ocasio-Cortez": {
    label: "Alexandria Ocasio-Cortez",
    color: "hsl(280, 70%, 50%)",
  },
};

const MarketChart = ({ data, candidates }: MarketChartProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Price History</h3>
        <div className="flex items-center gap-4 text-sm">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: chartColors[candidate.name as keyof typeof chartColors] }}
              />
              <span>{candidate.name}</span>
              <span className="font-medium">{candidate.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[0, 40]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {candidates.map((candidate) => (
              <Line
                key={candidate.id}
                type="monotone"
                dataKey={candidate.name}
                stroke={chartColors[candidate.name as keyof typeof chartColors]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <div className="text-sm text-muted-foreground">
        <span>$1,646,084 vol</span>
      </div>
    </div>
  );
};

export default MarketChart;