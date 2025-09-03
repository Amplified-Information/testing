import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { AccountBalanceQuery, Client } from '@hashgraph/sdk';
import { HashConnect } from 'hashconnect';

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
  walletConnector: HashConnect | null;
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
  const [walletConnector, setWalletConnector] = useState<HashConnect | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [pairingString, setPairingString] = useState<string | null>(null);
  const [network] = useState<"testnet" | "mainnet" | "previewnet">("testnet");

  useEffect(() => {
    initializeHashConnect();
  }, []);

  const initializeHashConnect = async () => {
    try {
      // Initialize HashConnect with proper metadata
      const hashConnect = new HashConnect(true);
      const metadata = {
        name: "Lovable DApp",
        description: "Prediction Markets on Hedera",
        icon: ""
      };
      await hashConnect.init(metadata, network);
      setWalletConnector(hashConnect);
      
      // Initialize Hedera client
      const hederaClient = Client.forName(network);
      setClient(hederaClient);
      
      // Listen for pairing with HashPack - exactly like user's example
      hashConnect.pairingEvent.once(async (pairingData) => {
        const accountId = pairingData.accountIds[0];
        
        setWallet({
          isConnected: true,
          accountId: accountId || null,
          balance: null,
          publicKey: null,
        });
        
        if (accountId) {
          // Fallback to Mirror Node for balance (simpler and more reliable)
          await fetchBalanceFromMirrorNode(accountId);
        }
        
        toast({
          title: 'HashPack Connected',
          description: `Connected to account ${accountId}`,
        });
        
        setIsLoading(false);
      });
      
      console.log('HashConnect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      toast({
        title: 'Initialization Failed',
        description: 'Failed to initialize HashConnect',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const fetchBalanceFromMirrorNode = async (accountId: string) => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
      );
      const data = await response.json();
      const balance = data.balance?.balance ? (data.balance.balance / 100000000).toString() : '0';
      
      setWallet(prev => ({ 
        ...prev, 
        balance: `${balance} ℏ` 
      }));
    } catch (error) {
      console.error('Failed to fetch balance from Mirror Node:', error);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    try {
      if (walletConnector) {
        // Use the same method as the user's example
        walletConnector.connectToLocalWallet();
        // The pairing event will handle the rest
      } else {
        throw new Error('HashConnect not initialized');
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
        // HashConnect disconnect requires the topic parameter
        try {
          walletConnector.disconnect((walletConnector as any).hcData?.topic || "");
        } catch (e) {
          console.log('Disconnect completed');
        }
      }
      
      // Reset wallet state
      setWallet({
        isConnected: false,
        accountId: null,
        balance: null,
        publicKey: null,
      });
      setPairingString(null);
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Your HashPack wallet has been disconnected',
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // Reset state anyway
      setWallet({
        isConnected: false,
        accountId: null,
        balance: null,
        publicKey: null,
      });
      toast({
        title: 'Disconnected',
        description: 'Wallet has been disconnected',
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