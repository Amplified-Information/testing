import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import { toast } from "@/hooks/use-toast";
import { useDebugger } from "@/hooks/useDebugger";
import { useSaveWallet, usePrimaryWallet } from "@/hooks/useHederaWallets";

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  publicKey: string | null;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  walletConnector: null;
  extendSession: () => void;
  sessionTimeRemaining: number | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const debug = useDebugger('WalletProvider');
  const { mutateAsync: saveWallet } = useSaveWallet();
  const { data: primaryWallet } = usePrimaryWallet();
  
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    publicKey: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  
  // Check for previous wallet connection
  useEffect(() => {
    if (primaryWallet?.account_id) {
      setWallet({
        isConnected: true,
        accountId: primaryWallet.account_id,
        publicKey: primaryWallet.public_key,
      });
      debug.log('Restored previous wallet connection', primaryWallet.account_id);
    }
  }, [debug, primaryWallet]);

  const extendSession = useCallback(() => {
    debug.log('Session extension');
    if (sessionTimeRemaining && sessionTimeRemaining < 300000) { // 5 minutes
      setSessionTimeRemaining(900000); // Reset to 15 minutes
      toast({
        title: "Session Extended",
        description: "Your wallet session has been extended",
      });
    }
  }, [debug, sessionTimeRemaining]);

  const connect = async () => {
    try {
      setIsLoading(true);
      debug.log('Attempting wallet connection');

      // For now, prompt user to enter account ID (simplified connection)
      const accountId = prompt('Enter your Hedera account ID (e.g., 0.0.12345):');
      
      if (!accountId || !accountId.match(/^\d+\.\d+\.\d+$/)) {
        throw new Error('Invalid account ID format. Please use format: 0.0.12345');
      }

      setWallet({
        isConnected: true,
        accountId,
        publicKey: null, // We don't have public key in this simplified version
      });

      // Save wallet to database
      await saveWallet({
        accountId,
        publicKey: null,
        walletName: "Manual Connection",
        isPrimary: true,
      });

      // Set session timeout (15 minutes)
      setSessionTimeRemaining(900000);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId}`,
      });

      debug.log('Wallet connected successfully', accountId);
    } catch (error) {
      debug.error('Wallet connection failed', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      debug.log('Disconnecting wallet');

      setWallet({
        isConnected: false,
        accountId: null,
        publicKey: null,
      });

      setSessionTimeRemaining(null);

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });

      debug.log('Wallet disconnected successfully');
    } catch (error) {
      debug.error('Wallet disconnect failed', error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Session timeout management
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionTimeRemaining && sessionTimeRemaining > 0) {
      interval = setInterval(() => {
        setSessionTimeRemaining(prev => {
          if (prev && prev <= 1000) {
            // Session expired, disconnect wallet
            disconnect();
            return null;
          }
          return prev ? prev - 1000 : null;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionTimeRemaining]);

  const contextValue = useMemo(
    () => ({ 
      wallet, 
      connect, 
      disconnect, 
      isLoading, 
      walletConnector: null,
      extendSession,
      sessionTimeRemaining,
    }),
    [wallet, isLoading, extendSession, sessionTimeRemaining, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};