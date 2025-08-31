import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { AccountId, AccountBalanceQuery, Client, LedgerId } from '@hashgraph/sdk';
import { hashPackConnector, HashPackWalletState } from '@/lib/hashpack';

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
  walletConnector: typeof hashPackConnector | null;
  pairingString: string | null;
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
  const [walletConnector, setWalletConnector] = useState<typeof hashPackConnector | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [pairingString, setPairingString] = useState<string | null>(null);

  useEffect(() => {
    initializeWalletConnector();
  }, []);

  const initializeWalletConnector = async () => {
    try {
      // Initialize Hedera client for testnet
      const hederaClient = Client.forTestnet();
      setClient(hederaClient);
      
      // Initialize HashPack connector
      setWalletConnector(hashPackConnector);
      
      // Set up HashPack event listeners
      hashPackConnector.onConnect((hashPackState: HashPackWalletState) => {
        setWallet({
          isConnected: true,
          accountId: hashPackState.accountIds[0] || null,
          balance: null,
          publicKey: null,
        });
        
        if (hashPackState.accountIds[0]) {
          fetchBalance(hashPackState.accountIds[0]);
        }
        
        toast({
          title: 'HashPack Connected',
          description: `Connected to account ${hashPackState.accountIds[0]}`,
        });
        
        setIsLoading(false);
      });
      
      hashPackConnector.onDisconnect(() => {
        setWallet({
          isConnected: false,
          accountId: null,
          balance: null,
          publicKey: null,
        });
        
        toast({
          title: 'HashPack Disconnected',
          description: 'Your HashPack wallet has been disconnected',
        });
        
        setIsLoading(false);
      });
      
      hashPackConnector.onError((error: Error) => {
        console.error('HashPack error:', error);
        toast({
          title: 'HashPack Error',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
      });
      
      // Initialize HashPack
      await hashPackConnector.initialize();
      setPairingString(hashPackConnector.getPairingString());
      
      console.log('HashPack connector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HashPack connector:', error);
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize HashPack connector',
        variant: 'destructive',
      });
    }
  };

  const fetchBalance = async (accountId: string) => {
    try {
      // Use Hedera Mirror Node API for balance queries
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
      );
      const data = await response.json();
      const balance = data.balance?.balance ? (data.balance.balance / 100000000).toString() : '0';
      
      setWallet(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    try {
      if (walletConnector) {
        await walletConnector.connect();
        setPairingString(walletConnector.getPairingString());
      } else {
        throw new Error('Wallet connector not initialized');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to HashPack. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      if (walletConnector) {
        await walletConnector.disconnect();
      }
      
      // Reset wallet state
      setWallet({
        isConnected: false,
        accountId: null,
        balance: null,
        publicKey: null,
      });
      setPairingString(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect wallet',
        variant: 'destructive',
      });
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
        pairingString,
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