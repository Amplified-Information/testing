import { useEffect, useRef } from 'react';

interface DebugLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

class AppDebugger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      message,
      data
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [HASHY-${level.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const appDebugger = new AppDebugger();

export const useDebugger = (component: string) => {
  const componentRef = useRef(component);

  useEffect(() => {
    appDebugger.log('info', `Component mounted: ${componentRef.current}`);
    return () => {
      appDebugger.log('info', `Component unmounted: ${componentRef.current}`);
    };
  }, []);

  return {
    log: (message: string, data?: any) => appDebugger.log('info', `[${componentRef.current}] ${message}`, data),
    warn: (message: string, data?: any) => appDebugger.log('warn', `[${componentRef.current}] ${message}`, data),
    error: (message: string, data?: any) => appDebugger.log('error', `[${componentRef.current}] ${message}`, data),
  };
};