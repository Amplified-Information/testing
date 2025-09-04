import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { 
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";
import { toast } from "@/hooks/use-toast";
import { useDebugger } from "@/hooks/useDebugger";

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
  walletConnector: DAppConnector | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const debug = useDebugger('WalletProvider');
  
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    publicKey: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnector, setWalletConnector] = useState<DAppConnector | null>(null);

  // Use ref to access current wallet state without causing re-renders
  const walletRef = useRef(wallet);
  const connectorRef = useRef<DAppConnector | null>(null);
  walletRef.current = wallet;

  // Stable event handler functions - stored in refs to avoid recreating
  const sessionUpdateHandler = useRef((event: any) => {
    debug.log('Session updated', event);
    try {
      const session = connectorRef.current?.walletConnectClient?.session?.getAll()[0];
      if (session) {
        const accounts = session.namespaces?.hedera?.accounts || [];
        const newAccountId = accounts[0]?.split(":")[2] || null;
        const currentAccountId = walletRef.current.accountId;
        
        if (newAccountId !== currentAccountId) {
          debug.log('Account changed', { from: currentAccountId, to: newAccountId });
          setWallet(prev => ({ 
            ...prev, 
            accountId: newAccountId,
            isConnected: !!newAccountId 
          }));
          
          if (newAccountId) {
            toast({
              title: "Account Changed",
              description: `Switched to ${newAccountId}`,
            });
          }
        }
      }
    } catch (error) {
      debug.error('Failed to handle session update', error);
    }
  });

  const sessionDeleteHandler = useRef(() => {
    debug.log('Session deleted - disconnecting wallet');
    setWallet({
      isConnected: false,
      accountId: null,
      publicKey: null,
    });
  });

  // Stable event handler - no dependencies to prevent infinite loops
  const handleSessionEvents = useCallback((connector: DAppConnector) => {
    connectorRef.current = connector;
    
    // Add event listeners
    connector.walletConnectClient?.on('session_update', sessionUpdateHandler.current);
    connector.walletConnectClient?.on('session_delete', sessionDeleteHandler.current);
  }, [debug]);

  // Cleanup function to remove event listeners
  const cleanupEventListeners = useCallback(() => {
    const connector = connectorRef.current;
    if (connector?.walletConnectClient) {
      debug.log('Removing event listeners');
      connector.walletConnectClient.off('session_update', sessionUpdateHandler.current);
      connector.walletConnectClient.off('session_delete', sessionDeleteHandler.current);
    }
  }, [debug]);

  // Initialize DAppConnector only once on mount
  useEffect(() => {
    const init = async () => {
      try {
        debug.log('Initializing wallet connector');
        
        const metadata = {
          name: "Hashy Markets",
          description: "Prediction Markets on Hedera",
          url: window.location.origin,
          icons: [""],
        };

        const connector = new DAppConnector(
          metadata,
          LedgerId.TESTNET,
          import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Testnet]
        );

        await connector.init({ logger: "error" });
        
        handleSessionEvents(connector);
        setWalletConnector(connector);
        
        // Proper session restoration using connector session
        const sessions = connector.walletConnectClient?.session?.getAll() || [];
        if (sessions.length > 0) {
          debug.log('Found existing session, attempting to restore');
          try {
            const session = sessions[0];
            const accounts = session.namespaces?.hedera?.accounts || [];
            
            if (accounts.length > 0) {
              const accountId = accounts[0].split(":")[2];
              const publicKey = null; // Will be fetched via API if needed
              
              setWallet({
                isConnected: true,
                accountId,
                publicKey,
              });
              
              debug.log('Session restored successfully', { accountId });
              toast({
                title: "Wallet Reconnected",
                description: `Connected to ${accountId}`,
              });
            }
          } catch (error) {
            debug.error('Failed to restore session', error);
          }
        }
        
        debug.log('Wallet connector initialized successfully');
      } catch (error) {
        debug.error("Failed to initialize DAppConnector", error);
        toast({
          title: "Initialization Failed",
          description: "Failed to initialize wallet connector. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    init();
    
    // Cleanup function - properly remove event listeners and clean up connections
    return () => {
      debug.log('Cleaning up wallet connector');
      
      const connector = connectorRef.current;
      
      // Run targeted cleanup to remove specific event listeners
      cleanupEventListeners();
      
      // Clean up any active sessions on unmount
      if (connector?.walletConnectClient?.session) {
        try {
          const sessions = connector.walletConnectClient.session.getAll();
          sessions.forEach(session => {
            debug.log('Cleaning up session on unmount', session.topic);
            connector.walletConnectClient?.session.delete(
              session.topic,
              { code: 6000, message: "Component unmounted" }
            ).catch(error => {
              debug.error('Error cleaning up session on unmount', error);
            });
          });
        } catch (error) {
          debug.error('Error during session cleanup on unmount', error);
        }
      }
      
      // Clear refs
      connectorRef.current = null;
    };
  }, []); // Only run once on mount

  const connect = async () => {
    if (!walletConnector) {
      debug.error('Wallet connector not initialized');
      toast({
        title: "Connection Error",
        description: "Wallet connector not ready. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    debug.log('Initiating wallet connection');
    
    // Inform user about desktop HashPack flow
    toast({
      title: "Connecting...",
      description: "If using HashPack extension, please approve the connection in the extension popup.",
    });
    
    try {
      // Opens QR modal (mobile) or connects extension (desktop HashPack/Blade)
      await walletConnector.openModal();

      // Wait for session establishment with polling for HashPack extension
      let session = null;
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds total
      
      while (!session && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        session = walletConnector.walletConnectClient?.session?.getAll()[0];
        attempts++;
      }
      
      if (!session) {
        throw new Error("No session established - HashPack extension may be locked or WalletConnect disabled. Please ensure HashPack is unlocked, on Testnet, and has WalletConnect v2 enabled in settings.");
      }

      const accountId = session.namespaces?.hedera?.accounts?.[0]?.split(":")[2];
      if (!accountId) {
        throw new Error("No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account.");
      }

      // Validate that this is a testnet account
      const publicKey = null; // Can be fetched via API if needed

      debug.log('Wallet connected successfully', { accountId, publicKey });

      // Update wallet state
      setWallet({
        isConnected: true,
        accountId,
        publicKey,
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId}`,
      });

      debug.log('Connection process completed', { accountId, publicKey });
    } catch (error: any) {
      debug.error("Wallet connect failed", error);
      
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      // Enhanced error handling for HashPack extension issues
      if (error.message?.includes("No session established")) {
        errorMessage = "HashPack connection failed. Please check: 1) HashPack extension is installed & unlocked, 2) Set to Testnet network, 3) WalletConnect v2 enabled in HashPack settings → DApp Connections.";
      } else if (error.message?.includes("No Testnet accounts found") || 
          error.message?.includes("no appropriate accounts")) {
        errorMessage = "No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account. Visit the Hedera Testnet Portal to create an account if needed.";
      } else if (error.message?.includes("User rejected")) {
        errorMessage = "Connection was cancelled. Please try again and approve the connection in your wallet.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your network connection and try again.";
      }
      
      toast({
        title: "Connection Error", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    debug.log('Disconnecting wallet');
    
    try {
      if (walletConnector?.walletConnectClient?.session) {
        const sessions = walletConnector.walletConnectClient.session.getAll();
        for (const session of sessions) {
          debug.log('Deleting session', session.topic);
          await walletConnector.walletConnectClient.session.delete(
            session.topic,
            { code: 6000, message: "User disconnected" }
          );
        }
      }
    } catch (error) {
      debug.error("Error disconnecting sessions", error);
    }
    
    // Clear wallet state
    setWallet({
      isConnected: false,
      accountId: null,
      publicKey: null,
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
    
    debug.log('Wallet disconnected successfully');
  };

  return (
    <WalletContext.Provider
      value={{ wallet, connect, disconnect, isLoading, walletConnector }}
    >
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