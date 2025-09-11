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
import { SignClient } from "@walletconnect/sign-client";
import type { ISignClient } from "@walletconnect/types";

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  publicKey: string | null;
  walletName?: string;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  walletConnector: ISignClient | null;
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
  const [walletConnector, setWalletConnector] = useState<ISignClient | null>(null);
  
  // Initialize WalletConnect  
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        debug.log('Initializing WalletConnect for Hedera');
        
        // Create SignClient for WalletConnect v2
        const signClient = await SignClient.init({
          projectId: process.env.WALLETCONNECT_PROJECT_ID || "hedera-prediction-markets", 
          metadata: {
            name: "Hedera Prediction Markets",
            description: "Trade on prediction markets powered by Hedera Hashgraph",
            url: window.location.origin,
            icons: [window.location.origin + "/favicon.ico"],
          },
        });

        setWalletConnector(signClient);
        debug.log('WalletConnect initialized successfully');

        // Check for existing sessions
        const sessions = signClient.session.getAll();
        if (sessions.length > 0) {
          const session = sessions[0];
          // Parse Hedera account from WalletConnect session
          const accounts = session.namespaces?.hedera?.accounts || [];
          if (accounts.length > 0) {
            const accountId = accounts[0].replace('hedera:testnet:', '').replace('hedera:mainnet:', '');
            debug.log('Found existing WalletConnect session', accountId);
            setWallet({
              isConnected: true,
              accountId,
              publicKey: null,
              walletName: session.peer.metadata.name || 'Connected Wallet',
            });
            setSessionTimeRemaining(900000); // 15 minutes
          }
        }
      } catch (error) {
        debug.error('Failed to initialize WalletConnect', error);
        // Don't show error toast, just log it - we'll fall back to manual connection
      }
    };

    initWalletConnect();
  }, [debug]);

  // Check for restored wallet connection from database
  useEffect(() => {
    if (primaryWallet?.account_id && !wallet.isConnected) {
      setWallet({
        isConnected: true,
        accountId: primaryWallet.account_id,
        publicKey: primaryWallet.public_key,
        walletName: primaryWallet.wallet_name || 'Restored Wallet',
      });
      debug.log('Restored previous wallet connection', primaryWallet.account_id);
    }
  }, [debug, primaryWallet, wallet.isConnected]);

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

      if (!walletConnector) {
        // Fallback to manual connection if WalletConnect is not available
        debug.log('WalletConnect not available, using manual connection');
        
        const accountId = prompt('Enter your Hedera account ID (e.g., 0.0.12345):');
        
        if (!accountId || !accountId.match(/^\d+\.\d+\.\d+$/)) {
          throw new Error('Invalid account ID format. Please use format: 0.0.12345');
        }

        setWallet({
          isConnected: true,
          accountId,
          publicKey: null,
          walletName: "Manual Connection",
        });

        // Save wallet to database
        await saveWallet({
          accountId,
          publicKey: null,
          walletName: "Manual Connection",
          isPrimary: true,
        });

        setSessionTimeRemaining(900000);

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accountId}`,
        });

        debug.log('Manual wallet connection successful', accountId);
        return;
      }

      // Try WalletConnect connection
      try {
        debug.log('Attempting WalletConnect pairing');
        
        const { uri, approval } = await walletConnector.connect({
          requiredNamespaces: {
            hedera: {
              methods: [
                "hedera_getNodeAddresses",
                "hedera_executeTransaction",
                "hedera_signTransaction"
              ],
              chains: ["hedera:testnet"],
              events: [],
            },
          },
        });

        if (uri) {
          // For now, just log the URI - in a real implementation you'd show QR code
          debug.log('WalletConnect URI generated:', uri);
          
          // Simple QR code display for now
          const qrMessage = `Please scan this QR code with your wallet:\n\n${uri}\n\nOr copy the URI manually.`;
          alert(qrMessage);
        }

        const session = await approval();
        debug.log('WalletConnect session approved');

        const accounts = session.namespaces?.hedera?.accounts || [];
        if (accounts.length === 0) {
          throw new Error('No Hedera accounts found in session');
        }

        const accountId = accounts[0].replace('hedera:testnet:', '').replace('hedera:mainnet:', '');
        const walletName = session.peer.metadata.name || 'Connected Wallet';

        setWallet({
          isConnected: true,
          accountId,
          publicKey: null,
          walletName,
        });

        // Save wallet to database
        await saveWallet({
          accountId,
          publicKey: null,
          walletName,
          isPrimary: true,
        });

        setSessionTimeRemaining(900000);

        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletName} (${accountId})`,
        });

        debug.log('WalletConnect connection successful', { accountId, walletName });

      } catch (wcError: any) {
        debug.error('WalletConnect connection failed, trying manual fallback', wcError);
        
        // Fallback to manual connection
        const accountId = prompt('WalletConnect failed. Enter your Hedera account ID manually (e.g., 0.0.12345):');
        
        if (!accountId || !accountId.match(/^\d+\.\d+\.\d+$/)) {
          throw new Error('Invalid account ID format. Please use format: 0.0.12345');
        }

        setWallet({
          isConnected: true,
          accountId,
          publicKey: null,
          walletName: "Manual Connection",
        });

        await saveWallet({
          accountId,
          publicKey: null,
          walletName: "Manual Connection",
          isPrimary: true,
        });

        setSessionTimeRemaining(900000);

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accountId} (Manual)`,
        });

        debug.log('Manual fallback connection successful', accountId);
      }

    } catch (error: any) {
      debug.error('All connection methods failed', error);
      
      let errorMessage = "Failed to connect wallet";
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        errorMessage = "Connection cancelled by user";
      } else if (error.message?.includes('Invalid account ID')) {
        errorMessage = error.message;
      } else if (error.message?.includes('No Hedera account')) {
        errorMessage = "No Hedera accounts found. Please ensure your wallet is connected to Hedera testnet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
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

      // Disconnect from WalletConnect if active
      if (walletConnector) {
        try {
          const sessions = walletConnector.session.getAll();
          for (const session of sessions) {
            await walletConnector.disconnect({
              topic: session.topic,
              reason: { code: 6000, message: "User disconnected" }
            });
          }
          debug.log('WalletConnect sessions disconnected');
        } catch (error) {
          debug.warn('Error disconnecting WalletConnect sessions', error);
        }
      }

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
      walletConnector,
      extendSession,
      sessionTimeRemaining,
    }),
    [wallet, isLoading, walletConnector, extendSession, sessionTimeRemaining, connect, disconnect]
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