import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

export interface ConnectionAttempt {
  attempt: number;
  timestamp: Date;
  error?: string;
  success: boolean;
}

/**
 * Enhanced wallet connection hook with retry logic and error tracking
 */
export const useWalletConnection = () => {
  const { connect, disconnect, isLoading, wallet } = useWallet();
  const [connectionHistory, setConnectionHistory] = useState<ConnectionAttempt[]>([]);
  
  const connectWithRetry = useCallback(async (maxRetries = 3) => {
    const attemptTimestamp = new Date();
    let currentAttempt = 0;
    
    const attempt = async (): Promise<boolean> => {
      currentAttempt++;
      
      try {
        await connect();
        
        // Record successful attempt
        setConnectionHistory(prev => [...prev, {
          attempt: currentAttempt,
          timestamp: attemptTimestamp,
          success: true,
        }]);
        
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown connection error';
        
        // Record failed attempt
        setConnectionHistory(prev => [...prev, {
          attempt: currentAttempt,
          timestamp: attemptTimestamp,
          error: errorMessage,
          success: false,
        }]);
        
        // Determine if we should retry
        const shouldRetry = 
          currentAttempt < maxRetries && 
          !errorMessage.includes('User rejected') && // Don't retry user cancellations
          !errorMessage.includes('cancelled'); // Don't retry explicit cancellations
        
        if (shouldRetry) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, currentAttempt - 1) * 1000;
          
          toast({
            title: `Connection Failed (${currentAttempt}/${maxRetries})`,
            description: `Retrying in ${delay / 1000} seconds...`,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return attempt(); // Recursive retry
        }
        
        // Final failure
        toast({
          title: "Connection Failed",
          description: `Failed after ${currentAttempt} attempts: ${errorMessage}`,
          variant: "destructive",
        });
        
        return false;
      }
    };
    
    return attempt();
  }, [connect]);
  
  const getConnectionStats = useCallback(() => {
    const total = connectionHistory.length;
    const successful = connectionHistory.filter(h => h.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    return {
      total,
      successful,
      failed,
      successRate: Math.round(successRate),
      recentErrors: connectionHistory
        .filter(h => !h.success)
        .slice(-3) // Last 3 errors
        .map(h => h.error),
    };
  }, [connectionHistory]);
  
  const clearConnectionHistory = useCallback(() => {
    setConnectionHistory([]);
  }, []);
  
  return {
    connect: connectWithRetry,
    disconnect,
    isLoading,
    wallet,
    connectionHistory,
    connectionStats: getConnectionStats(),
    clearConnectionHistory,
  };
};