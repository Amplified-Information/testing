import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import type { EChartsOption } from "echarts";
import { ChartData } from "@/types/charts";

interface BarChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  color?: string;
  horizontal?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  showGrid?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 400,
  color = '#3b82f6',
  horizontal = false,
  className,
  theme = 'light',
  showGrid = true
}) => {
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
      borderColor: color,
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      axisLabel: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
      },
      splitLine: showGrid ? {
        lineStyle: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6'
        }
      } : { show: false }
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map(item => item.name) : undefined,
      axisLine: {
        lineStyle: {
          color: theme === 'dark' ? '#4b5563' : '#d1d5db'
        }
      },
      axisLabel: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
      },
      splitLine: showGrid ? {
        lineStyle: {
          color: theme === 'dark' ? '#374151' : '#f3f4f6'
        }
      } : { show: false }
    },
    series: [
      {
        name: 'Value',
        type: 'bar',
        data: data.map(item => item.value),
        itemStyle: {
          color: color,
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: color + 'CC'
          }
        }
      }
    ]
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