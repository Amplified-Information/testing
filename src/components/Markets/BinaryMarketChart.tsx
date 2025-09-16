import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BinaryMarketChartProps {
  data: any[];
  yesPrice: number;
  noPrice: number;
  volume: number;
}

const timeRanges = [
  { label: '1D', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' }
];

const BinaryMarketChart = ({ data, yesPrice, noPrice, volume }: BinaryMarketChartProps) => {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [showVolume, setShowVolume] = useState(true);

  // Transform data to have consistent yes/no fields
  const chartData = data.length > 0 ? data.map(item => ({
    ...item,
    yes: item.Yes || yesPrice * 100, // Use standardized "Yes" key from transformation
    no: item.No || noPrice * 100,   // Use standardized "No" key from transformation
    volume: volume * (0.1 + Math.random() * 0.1) // Add some volume variation
  })) : [
    { date: '2024-01-01', yes: yesPrice * 100, no: noPrice * 100, volume: volume * 0.1 },
    { date: '2024-01-02', yes: (yesPrice + 0.02) * 100, no: (noPrice - 0.02) * 100, volume: volume * 0.15 },
    { date: '2024-01-03', yes: (yesPrice - 0.01) * 100, no: (noPrice + 0.01) * 100, volume: volume * 0.12 },
    { date: '2024-01-04', yes: (yesPrice + 0.03) * 100, no: (noPrice - 0.03) * 100, volume: volume * 0.18 },
    { date: '2024-01-05', yes: yesPrice * 100, no: noPrice * 100, volume: volume * 0.14 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Price History</CardTitle>
          <div className="flex items-center gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
                className="text-xs px-2 py-1"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>YES</span>
              <span className="font-medium">{Math.round(yesPrice * 100)}¢</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>NO</span>
              <span className="font-medium">{Math.round(noPrice * 100)}¢</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
            className="text-xs"
          >
            {showVolume ? 'Hide' : 'Show'} Volume
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={{
          yes: { label: "YES", color: "hsl(var(--primary))" },
          no: { label: "NO", color: "hsl(var(--destructive))" },
          volume: { label: "Volume", color: "hsl(var(--muted-foreground))" }
        }} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis 
                yAxisId="price"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}¢`}
              />
              {showVolume && (
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
              )}
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
                  } catch {
                    return value;
                  }
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'volume') return [`$${Math.round(value).toLocaleString()}`, 'Volume'];
                  return [`${Math.round(value)}¢`, name.toUpperCase()];
                }}
              />
              
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="yes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="no"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="hsl(var(--muted-foreground))"
                  opacity={0.3}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>${volume.toLocaleString()} total volume</span>
          <span>24h change: +2.3%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BinaryMarketChart;