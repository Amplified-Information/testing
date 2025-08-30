import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import type { EChartsOption } from "echarts";
import { LineChartData } from "@/types/charts";

interface AreaChartProps {
  data: LineChartData[] | LineChartData[][];
  title?: string;
  height?: number;
  colors?: string[];
  smooth?: boolean;
  stack?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  categories?: string[];
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  height = 400,
  colors = ['#3b82f6', '#ef4444', '#10b981'],
  smooth = true,
  stack = false,
  className,
  theme = 'light',
  categories
}) => {
  // Handle both single series and multiple series data
  const isMultiSeries = Array.isArray(data[0]) && Array.isArray(data);
  const seriesData = isMultiSeries ? data as LineChartData[][] : [data as LineChartData[]];
  const seriesNames = categories || seriesData.map((_, index) => `Series ${index + 1}`);

  const option: EChartsOption = {
    title: title ? {
      text: title,
      left: 'center',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000',
        fontSize: 16,
        fontWeight: 'normal'
      }
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme === 'dark' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: colors[0]
        }
      }
    },
    legend: seriesData.length > 1 ? {
      data: seriesNames,
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }
    } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: seriesData[0]?.map(item => item.date) || [],
      axisLine: {
        lineStyle: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      axisLabel: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      axisLabel: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6'
        }
      }
    },
    series: seriesData.map((series, index) => ({
      name: seriesNames[index],
      type: 'line',
      stack: stack ? 'Total' : undefined,
      smooth: smooth,
      data: series.map(item => item.value),
      lineStyle: {
        color: colors[index % colors.length],
        width: 2
      },
      itemStyle: {
        color: colors[index % colors.length]
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: colors[index % colors.length] + '60' },
            { offset: 1, color: colors[index % colors.length] + '10' }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      }
    }))
  };

  return (
    <EChartsWrapper
      option={option}
      style={{ height: `${height}px` }}
      className={className}
      theme={theme}
    />
  );
};