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

// Helper function to extract account ID from session
function getAccountIdFromSession(session: any): string | null {
  if (!session) return null;
  const accounts = session.namespaces?.hedera?.accounts ?? [];
  return accounts[0]?.split(":")[2] ?? null;
}

// Mirror Node API interface
interface MirrorAccountResponse {
  key?: {
    key?: string;
  };
}

// Fetch public key from Hedera Mirror Node
async function fetchPublicKey(accountId: string): Promise<string | null> {
  try {
    const url = `${import.meta.env.VITE_MIRROR_NODE_URL}/accounts/${accountId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: MirrorAccountResponse = await response.json();
    return data.key?.key ?? null;
  } catch (error) {
    console.error('Failed to fetch public key from Mirror Node:', error);
    return null;
  }
}

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
      const newAccountId = getAccountIdFromSession(session);
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
            const accountId = getAccountIdFromSession(session);
            
            if (accountId) {
              // Auto-fetch public key for restored session
              const publicKey = await fetchPublicKey(accountId);
              
              setWallet({
                isConnected: true,
                accountId,
                publicKey,
              });
              
              debug.log('Session restored successfully', { accountId, publicKey: !!publicKey });
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
    
    // Cleanup function - only remove event listeners (preserve session persistence)
    return () => {
      debug.log('Cleaning up wallet connector');
      
      // Only remove event listeners, don't delete sessions for persistence
      cleanupEventListeners();
      
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
    
    try {
      // Show generic connection message
      toast({
        title: "Opening wallet selection...",
        description: "Choose your preferred wallet from the options.",
      });
      
      // Create timeout promise to handle modal cancellation
      const modalPromise = walletConnector.openModal();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("MODAL_TIMEOUT")), 30000); // 30 second timeout
      });
      
      // Race between modal opening and timeout
      await Promise.race([modalPromise, timeoutPromise]);
      
      // Wait briefly for session to be established (polling approach)
      let session = null;
      let attempts = 0;
      const maxAttempts = 10; // 2 seconds total wait time
      
      while (attempts < maxAttempts && !session) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
        session = walletConnector.walletConnectClient?.session?.getAll()[0];
        attempts++;
      }
      
      // If no session after polling, user likely cancelled
      if (!session) {
        debug.log('No session found after polling - user likely cancelled');
        // Don't throw error for cancellation, just return silently
        return;
      }

      const accountId = getAccountIdFromSession(session);
      if (!accountId) {
        throw new Error("No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account.");
      }

      // Detect wallet type after successful connection
      const isHashPackInstalled = !!(window as any).hashpack;
      const walletType = isHashPackInstalled ? 'HashPack' : 'wallet';
      
      // Auto-fetch public key after successful connection
      debug.log('Fetching public key for account:', accountId);
      const publicKey = await fetchPublicKey(accountId);

      debug.log('Wallet connected successfully', { accountId, publicKey: !!publicKey, walletType });

      // Update wallet state with public key
      setWallet({
        isConnected: true,
        accountId,
        publicKey,
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId} via ${walletType}${publicKey ? ' with public key' : ''}`,
      });

      debug.log('Connection process completed', { accountId, publicKey: !!publicKey });
    } catch (error: any) {
      debug.error("Wallet connect failed", error);
      
      // Handle timeout/cancellation separately from connection errors
      if (error.message === "MODAL_TIMEOUT") {
        debug.log('Modal timeout - user likely took too long or cancelled');
        return; // Don't show error for timeout
      }
      
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      // Context-aware error handling (only after we attempted connection)
      if (error.message?.includes("No Testnet accounts found") || 
          error.message?.includes("no appropriate accounts")) {
        errorMessage = "No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account. Visit the Hedera Testnet Portal to create an account if needed.";
      } else if (error.message?.includes("User rejected")) {
        errorMessage = "Connection was cancelled. Please try again and approve the connection in your wallet.";
      } else if (error.message?.includes("Connection timeout")) {
        errorMessage = "Connection timeout. Please try again and ensure you approve the connection promptly.";
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