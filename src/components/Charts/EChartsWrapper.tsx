import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { ChartOptions } from "@/types/charts";

interface EChartsWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  opts?: {
    renderer?: 'canvas' | 'svg';
    width?: number;
    height?: number;
  };
  onEvents?: Record<string, (params: any) => void>;
  showLoading?: boolean;
  loadingOption?: {
    text?: string;
    color?: string;
    textColor?: string;
    maskColor?: string;
    zlevel?: number;
  };
}

export const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  option,
  style,
  className,
  theme = 'light',
  opts,
  onEvents,
  showLoading = false,
  loadingOption,
}) => {
  const defaultStyle: React.CSSProperties = {
    height: '400px',
    width: '100%',
    ...style,
  };

  const defaultLoadingOption = {
    text: 'Loading...',
    color: 'hsl(var(--primary))',
    textColor: 'hsl(var(--foreground))',
    maskColor: 'hsl(var(--background) / 0.8)',
    zlevel: 0,
    ...loadingOption,
  };

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={defaultStyle}
        theme={theme}
        opts={opts}
        onEvents={onEvents}
        showLoading={showLoading}
        loadingOption={defaultLoadingOption}
      />
    </div>
  );
};