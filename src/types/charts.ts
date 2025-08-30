// Chart type definitions for Apache ECharts integration

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface LineChartData {
  date: string;
  value: number;
  category?: string;
}

export interface MarketChartData {
  timestamp: string;
  price: number;
  volume: number;
  option: string;
}

export interface CategoryChartData {
  category: string;
  count: number;
  volume: number;
  change24h: number;
}

export type ChartTheme = 'light' | 'dark';

export interface ChartOptions {
  theme?: ChartTheme;
  height?: number;
  width?: number;
  responsive?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  animation?: boolean;
}

import type { EChartsOption } from 'echarts';

export interface EChartsConfig extends EChartsOption {
  [key: string]: any;
}