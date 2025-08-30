import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import type { EChartsOption } from "echarts";
import { ChartData } from "@/types/charts";

interface PieChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  radius?: [string, string];
  showLegend?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  colors?: string[];
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 400,
  radius = ['40%', '70%'],
  showLegend = true,
  className,
  theme = 'light',
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
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
      trigger: 'item',
      backgroundColor: theme === 'dark' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      },
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: showLegend ? {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }
    } : undefined,
    color: colors,
    series: [
      {
        name: 'Data',
        type: 'pie',
        radius: radius,
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        },
        labelLine: {
          show: false
        },
        data: data
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