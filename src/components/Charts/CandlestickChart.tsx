import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import type { EChartsOption } from "echarts";

interface CandlestickData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  title?: string;
  height?: number;
  showVolume?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  title,
  height = 500,
  showVolume = true,
  className,
  theme = 'light'
}) => {
  const dates = data.map(item => item.date);
  const ohlcData = data.map(item => [item.open, item.close, item.low, item.high]);
  const volumeData = data.map(item => item.volume || 0);

  const upColor = '#00da3c';
  const downColor = '#ec0000';

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
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: theme === 'dark' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      },
      formatter: (params: any) => {
        const candlestick = params.find((p: any) => p.seriesName === 'Price');
        const volume = params.find((p: any) => p.seriesName === 'Volume');
        
        if (!candlestick) return '';
        
        const [open, close, low, high] = candlestick.data;
        let result = `${candlestick.name}<br/>`;
        result += `Open: ${open}<br/>`;
        result += `Close: ${close}<br/>`;
        result += `Low: ${low}<br/>`;
        result += `High: ${high}<br/>`;
        
        if (volume && showVolume) {
          result += `Volume: ${volume.data}`;
        }
        
        return result;
      }
    },
    legend: {
      data: showVolume ? ['Price', 'Volume'] : ['Price'],
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }
    },
    grid: showVolume ? [
      {
        left: '3%',
        right: '4%',
        height: '60%'
      },
      {
        left: '3%',
        right: '4%',
        top: '70%',
        height: '25%'
      }
    ] : {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: showVolume ? [
      {
        type: 'category',
        data: dates,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisPointer: {
          z: 100
        },
        axisLabel: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      }
    ] : {
      type: 'category',
      data: dates,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
      }
    },
    yAxis: showVolume ? [
      {
        scale: true,
        splitArea: {
          show: true
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
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ] : {
      scale: true,
      splitArea: {
        show: true
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
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: showVolume ? [0, 1] : [0],
        start: 50,
        end: 100
      },
      {
        show: true,
        xAxisIndex: showVolume ? [0, 1] : [0],
        type: 'slider',
        top: '90%',
        start: 50,
        end: 100
      }
    ],
    series: [
      {
        name: 'Price',
        type: 'candlestick',
        data: ohlcData,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upColor,
          borderColor0: downColor
        },
        emphasis: {
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor
          }
        }
      },
      ...(showVolume ? [{
        name: 'Volume',
        type: 'bar' as const,
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumeData,
        itemStyle: {
          color: function(params: any) {
            const dataIndex = params.dataIndex;
            return data[dataIndex].close >= data[dataIndex].open ? upColor : downColor;
          }
        }
      }] : [])
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