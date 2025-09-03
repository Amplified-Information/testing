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
      console.log('Starting HashConnect initialization...');
      
      // Initialize HashConnect with proper metadata
      const hashConnect = new HashConnect(true);
      console.log('HashConnect instance created');
      
      const metadata = {
        name: "Lovable DApp",
        description: "Prediction Markets on Hedera",
        icon: ""
      };
      
      console.log('Initializing with metadata:', metadata);
      await hashConnect.init(metadata, network);
      console.log('HashConnect init completed');
      
      setWalletConnector(hashConnect);
      
      // Initialize Hedera client
      const hederaClient = Client.forName(network);
      setClient(hederaClient);
      console.log('Hedera client initialized for', network);
      
      // Listen for pairing with HashPack - exactly like user's example
      hashConnect.pairingEvent.once(async (pairingData) => {
        console.log('Pairing event received:', pairingData);
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
      
      // Add error handling for connection failures
      hashConnect.connectionStatusChangeEvent.on((connectionStatus) => {
        console.log('Connection status changed:', connectionStatus);
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
    console.log('Connect button clicked');
    setIsLoading(true);
    
    // Set up a timeout to handle unresponsive connections
    const connectionTimeout = setTimeout(() => {
      console.log('Connection timeout - no response from HashPack');
      toast({
        title: 'Connection Timeout',
        description: 'HashPack wallet did not respond. Please make sure HashPack is installed and try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      if (walletConnector) {
        console.log('Attempting to connect to HashPack extension...');
        
        // Set up one-time success handler to clear timeout
        const handleSuccess = (pairingData: any) => {
          clearTimeout(connectionTimeout);
          console.log('Extension connection successful!');
        };
        
        walletConnector.pairingEvent.once(handleSuccess);
        
        // Use the correct method for HashConnect v2
        walletConnector.connectToLocalWallet();
        console.log('connectToLocalWallet() called - waiting for HashPack response...');
        
      } else {
        clearTimeout(connectionTimeout);
        console.error('HashConnect not initialized');
        throw new Error('HashConnect not initialized');
      }
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to HashPack. Please make sure the HashPack extension is installed.',
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