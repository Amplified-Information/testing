import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import type { EChartsOption } from "echarts";
import { LineChartData } from "@/types/charts";

interface LineChartProps {
  data: LineChartData[];
  title?: string;
  height?: number;
  color?: string;
  smooth?: boolean;
  showArea?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 400,
  color = '#3b82f6',
  smooth = true,
  showArea = false,
  className,
  theme = 'light'
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
      formatter: (params: any) => {
        const point = params[0];
        return `${point.name}<br/>${point.seriesName}: ${point.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date),
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
    series: [
      {
        name: 'Value',
        type: 'line',
        smooth: smooth,
        data: data.map(item => item.value),
        lineStyle: {
          color: color,
          width: 2
        },
        itemStyle: {
          color: color
        },
        areaStyle: showArea ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '10' }
            ]
          }
        } : undefined,
        emphasis: {
          focus: 'series'
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