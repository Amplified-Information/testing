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
      
      // Listen for pairing with HashPack
      hashConnect.pairingEvent.once(async (pairingData) => {
        console.log('✅ Pairing event received:', pairingData);
        const accountId = pairingData.accountIds[0];
        
        setWallet({
          isConnected: true,
          accountId: accountId || null,
          balance: null,
          publicKey: null,
        });
        
        if (accountId) {
          // Use Mirror Node for balance (compatible with current version)
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

    // Timeout handler
    const connectionTimeout = setTimeout(() => {
      toast({
        title: "Connection Timeout",
        description:
          "HashPack wallet did not respond. Please make sure HashPack is installed and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }, 10000);

    try {
      if (!walletConnector) {
        throw new Error("HashConnect not initialized");
      }

      // Listen for pairing
      walletConnector.pairingEvent.once((pairingData: any) => {
        clearTimeout(connectionTimeout);
        console.log("✅ Pairing event received:", pairingData);

        setWallet({
          isConnected: true,
          accountId: pairingData.accountIds[0] || null,
          publicKey: null, // Will be set after balance fetch
          balance: null,
        });

        // Fetch balance after successful pairing
        if (pairingData.accountIds[0]) {
          fetchBalanceFromMirrorNode(pairingData.accountIds[0]);
        }

        toast({
          title: 'HashPack Connected',
          description: `Connected to account ${pairingData.accountIds[0]}`,
        });

        setIsLoading(false);
      });

      // Try local wallet (desktop extension)
      console.log("Attempting local wallet connection...");
      walletConnector.connectToLocalWallet();

      // Fallback after short wait (for sandbox / mobile)
      setTimeout(() => {
        // Check if still loading and no connection established
        if (isLoading && !wallet.isConnected) {
          console.log("No extension response, trying alternative connection...");
          // Note: openPairingModal might not exist in v0.2.9, so we'll just log for now
          console.log("Consider updating HashConnect for QR modal support");
        }
      }, 3000);
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error("❌ Wallet connection failed:", error);
      toast({
        title: "Connection Error",
        description: (error as Error).message,
        variant: "destructive",
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