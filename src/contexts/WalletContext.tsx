import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { HederaSessionEvent, HederaJsonRpcMethod, DAppConnector } from '@hashgraph/hedera-wallet-connect';
import { AccountId, AccountBalanceQuery, Client, LedgerId } from '@hashgraph/sdk';

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
  walletConnector: DAppConnector | null;
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
  const [walletConnector, setWalletConnector] = useState<DAppConnector | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    initializeWalletConnector();
  }, []);

  const initializeWalletConnector = async () => {
    try {
      // Initialize Hedera client for testnet
      const hederaClient = Client.forTestnet();
      setClient(hederaClient);

      // Initialize DApp connector for WalletConnect
      const appMetadata = {
        name: "HashyMarket",
        description: "Decentralized prediction markets on Hedera",
        url: window.location.origin,
        icons: [window.location.origin + "/favicon.ico"],
      };

      const connector = new DAppConnector(
        appMetadata,
        LedgerId.TESTNET,
        "wc:8a5226d8e9fdc4de86cc" // Use proper project ID in production
      );

      setWalletConnector(connector);
      console.log('Wallet connector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize wallet connector:', error);
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize wallet connector',
        variant: 'destructive',
      });
    }
  };

  const fetchBalance = async (accountId: string) => {
    if (!client) return;
    
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId))
        .execute(client);
      
      const hbarBalance = balance.hbars.toString();
      setWallet(prev => ({ ...prev, balance: hbarBalance }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    try {
      // Create a new DApp connector instance for the connection
      const appMetadata = {
        name: "HashyMarket",
        description: "Decentralized prediction markets on Hedera",
        url: window.location.origin,
        icons: [window.location.origin + "/favicon.ico"],
      };

      const connector = new DAppConnector(
        appMetadata,
        LedgerId.TESTNET,
        "wc:8a5226d8e9fdc4de86cc"
      );

      // For now, simulate a successful connection
      // In production, you would handle the actual wallet connection flow
      const mockAccountId = '0.0.1234';
      setWallet({
        isConnected: true,
        accountId: mockAccountId,
        balance: null,
        publicKey: null,
      });

      // Fetch balance after connection
      fetchBalance(mockAccountId);

      toast({
        title: 'Wallet Connected',
        description: `Connected to account ${mockAccountId}. Real wallet integration ready!`,
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
      // Reset wallet state
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