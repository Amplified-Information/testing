import { useState, useEffect } from 'react';
import { appDebugger } from './useDebugger';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkQuality('fast');
      appDebugger.log('info', 'Network: Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality('offline');
      appDebugger.log('warn', 'Network: Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test network speed periodically
    const testNetworkSpeed = async () => {
      if (!navigator.onLine) return;

      try {
        const startTime = Date.now();
        await fetch('https://testnet.mirrornode.hedera.com/api/v1/network/nodes', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - startTime;
        
        if (duration > 3000) {
          setNetworkQuality('slow');
          appDebugger.log('warn', `Network: Slow connection detected (${duration}ms)`);
        } else {
          setNetworkQuality('fast');
        }
      } catch (error) {
        appDebugger.log('error', 'Network: Speed test failed', error);
        setNetworkQuality('slow');
      }
    };

    const interval = setInterval(testNetworkSpeed, 30000); // Test every 30 seconds
    testNetworkSpeed(); // Initial test

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, networkQuality };
};