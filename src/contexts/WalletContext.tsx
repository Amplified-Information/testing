import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  balance: string | null;
  publicKey: string | null;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  walletConnector: any | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    balance: null,
    publicKey: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnector, setWalletConnector] = useState<any | null>(null);

  useEffect(() => {
    initializeWalletConnector();
  }, []);

  const initializeWalletConnector = async () => {
    try {
      // Placeholder for wallet connector initialization
      // This will be implemented once the wallet connect library is properly configured
      console.log('Wallet connector initialization placeholder');
    } catch (error) {
      console.error('Failed to initialize wallet connector:', error);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    try {
      // Mock connection for demonstration - replace with actual wallet connector
      const mockAccountId = '0.0.1234';
      setWallet({
        isConnected: true,
        accountId: mockAccountId,
        balance: null,
        publicKey: null,
      });

      toast({
        title: 'Wallet Connected',
        description: `Connected to account ${mockAccountId}`,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      setWallet({
        isConnected: false,
        accountId: null,
        balance: null,
        publicKey: null,
      });

      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connect,
        disconnect,
        isLoading,
        walletConnector,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};