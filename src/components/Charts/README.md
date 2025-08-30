# Apache ECharts Integration

This directory contains ready-to-use Apache ECharts components for your prediction market platform.

## Available Components

### EChartsWrapper
Base wrapper component that provides common functionality for all charts.

### LineChart
Perfect for showing price trends, market performance over time.
```tsx
import { LineChart } from '@/components/Charts';

const data = [
  { date: '2024-01-01', value: 0.65 },
  { date: '2024-01-02', value: 0.68 },
  { date: '2024-01-03', value: 0.72 }
];

<LineChart 
  data={data} 
  title="Market Price Trend"
  color="#3b82f6"
  smooth={true}
  showArea={true}
/>
```

### BarChart
Great for category comparisons, volume displays.
```tsx
import { BarChart } from '@/components/Charts';

const data = [
  { name: 'Politics', value: 15 },
  { name: 'Sports', value: 8 },
  { name: 'Tech', value: 12 }
];

<BarChart 
  data={data} 
  title="Markets by Category"
  color="#10b981"
/>
```

### PieChart
Ideal for market share, category distribution.
```tsx
import { PieChart } from '@/components/Charts';

const data = [
  { name: 'Yes', value: 65 },
  { name: 'No', value: 35 }
];

<PieChart 
  data={data} 
  title="Market Sentiment"
  showLegend={true}
/>
```

### AreaChart
Perfect for stacked data, multiple series comparison.
```tsx
import { AreaChart } from '@/components/Charts';

const data = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-01-02', value: 120 }
];

<AreaChart 
  data={data} 
  title="Volume Over Time"
  smooth={true}
  showArea={true}
/>
```

### CandlestickChart
Financial-style charts for advanced market data.
```tsx
import { CandlestickChart } from '@/components/Charts';

const data = [
  { 
    date: '2024-01-01', 
    open: 0.60, 
    close: 0.65, 
    high: 0.68, 
    low: 0.58,
    volume: 1000 
  }
];

<CandlestickChart 
  data={data} 
  title="Market OHLC"
  showVolume={true}
/>
```

## Usage in Your Platform

### Market Detail Pages
Replace or enhance existing Recharts with ECharts:
- Line charts for price history
- Candlestick charts for detailed market data
- Volume bars for trading activity

### Dashboard Analytics
- Pie charts for category distribution
- Bar charts for market comparisons
- Area charts for volume trends

### Portfolio Views
- Performance line charts
- Allocation pie charts
- Profit/loss area charts

## Theme Support
All components support light/dark themes and will automatically adapt to your platform's theme system.

## Responsive Design
Charts automatically resize and are mobile-friendly.

## Next Steps
1. Choose where to integrate charts
2. Import the specific chart components you need
3. Pass your market data to the components
4. Customize colors and styling to match your brand