import { useEffect, useState, useCallback, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartTheme, EChartsConfig } from '@/types/charts';

interface UseEChartsOptions {
  theme?: ChartTheme;
  responsive?: boolean;
}

export const useECharts = (options: UseEChartsOptions = {}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { theme = 'light', responsive = true } = options;

  // Initialize chart instance
  const initChart = useCallback(() => {
    if (!chartRef.current) return null;

    try {
      // Dispose existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      // Create new chart instance
      const chart = echarts.init(chartRef.current, theme);
      chartInstanceRef.current = chart;

      // Enable responsive behavior
      if (responsive) {
        const resizeHandler = () => {
          chart?.resize();
        };
        window.addEventListener('resize', resizeHandler);
        
        // Store cleanup function
        chart.resize = () => {
          const originalResize = chart.resize;
          return () => {
            originalResize.call(chart);
            return () => window.removeEventListener('resize', resizeHandler);
          };
        };
      }

      return chart;
    } catch (err) {
      setError(`Failed to initialize chart: ${err}`);
      return null;
    }
  }, [theme, responsive]);

  // Update chart with new configuration
  const updateChart = useCallback((config: EChartsConfig) => {
    if (!chartInstanceRef.current) {
      const chart = initChart();
      if (!chart) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      chartInstanceRef.current?.setOption(config, true);
    } catch (err) {
      setError(`Failed to update chart: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [initChart]);

  // Show loading state
  const showLoading = useCallback(() => {
    chartInstanceRef.current?.showLoading();
  }, []);

  // Hide loading state
  const hideLoading = useCallback(() => {
    chartInstanceRef.current?.hideLoading();
  }, []);

  // Resize chart
  const resize = useCallback(() => {
    chartInstanceRef.current?.resize();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return {
    chartRef,
    chartInstance: chartInstanceRef.current,
    updateChart,
    showLoading,
    hideLoading,
    resize,
    loading,
    error,
    initChart
  };
};