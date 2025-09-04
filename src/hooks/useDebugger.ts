import { useEffect, useRef } from 'react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugLog {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

class AppDebugger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;
  private logLevel: LogLevel;

  constructor() {
    // Environment-based log filtering
    const mode = import.meta.env.MODE;
    this.logLevel = mode === 'development' ? 'debug' : 'warn';
  }

  private isVisualEditing(): boolean {
    // Detect if we're in visual editing mode
    return typeof window !== 'undefined' && (
      window.location.hostname.includes('lovable.app') ||
      window.parent !== window ||
      document.querySelector('[data-visual-editor]') !== null
    );
  }

  private shouldLog(level: LogLevel): boolean {
    // During visual editing, only allow error logs
    if (this.isVisualEditing() && level !== 'error') {
      return false;
    }

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;
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
    debug: (message: string, data?: any) => appDebugger.log('debug', `[${componentRef.current}] ${message}`, data),
    log: (message: string, data?: any) => appDebugger.log('info', `[${componentRef.current}] ${message}`, data),
    warn: (message: string, data?: any) => appDebugger.log('warn', `[${componentRef.current}] ${message}`, data),
    error: (message: string, data?: any) => appDebugger.log('error', `[${componentRef.current}] ${message}`, data),
  };
};