import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
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
import { supabase } from "@/integrations/supabase/client";
import { useSaveWallet, usePrimaryWallet } from "@/hooks/useHederaWallets";

// Helper function to extract account ID from session
function getAccountIdFromSession(session: any): string | null {
  if (!session) return null;
  const accounts = session.namespaces?.hedera?.accounts ?? [];
  return accounts[0]?.split(":")[2] ?? null;
}

// Mirror Node API interface
interface MirrorAccountResponse {
  key?: Record<string, unknown>;
}

// Fetch public key (handles different key structures)
async function fetchPublicKey(accountId: string): Promise<string | null> {
  try {
    const url = `${import.meta.env.VITE_MIRROR_NODE_URL}/accounts/${accountId}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: MirrorAccountResponse = await response.json();

    // Different formats: { key: { key } }, { key: { thresholdKey: {...} } }, etc.
    if (typeof data.key?.key === "string") return data.key.key;
    if (typeof data.key === "string") return data.key;
    return null;
  } catch (error) {
    console.error("Failed to fetch public key from Mirror Node:", error);
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Database operations
  const saveWalletMutation = useSaveWallet();
  const { data: primaryWallet, refetch: refetchPrimaryWallet } = usePrimaryWallet();

  // Use ref to access current wallet state without causing re-renders
  const walletRef = useRef(wallet);
  const connectorRef = useRef<DAppConnector | null>(null);
  walletRef.current = wallet;

  // Function to save wallet to database after connection
  const saveConnectedWallet = useCallback(async (accountId: string, publicKey: string | null) => {
    if (!currentUser) {
      debug.log('No authenticated user, skipping wallet save');
      return;
    }

    try {
      debug.log('Saving connected wallet to database', { accountId });
      await saveWalletMutation.mutateAsync({
        accountId,
        publicKey,
        isPrimary: true, // Make newly connected wallet primary by default
      });
    } catch (error) {
      debug.error('Failed to save wallet to database', error);
      // Don't throw error - connection should still work even if save fails
    }
  }, [currentUser, saveWalletMutation, debug]);

  // Function to load primary wallet for authenticated user
  const loadPrimaryWallet = useCallback(async () => {
    if (!primaryWallet || !walletConnector) {
      debug.log('No primary wallet found or connector not ready');
      return;
    }

    try {
      debug.log('Loading primary wallet from database', primaryWallet);
      
      // Check if there's an active WalletConnect session for this account
      const sessions = walletConnector.walletConnectClient?.session?.getAll() || [];
      const activeSession = sessions.find(session => {
        const sessionAccountId = getAccountIdFromSession(session);
        return sessionAccountId === primaryWallet.account_id;
      });

      if (activeSession) {
        debug.log('Found active session for primary wallet, restoring connection');
        setWallet({
          isConnected: true,
          accountId: primaryWallet.account_id,
          publicKey: primaryWallet.public_key,
        });
        
        toast({
          title: "Wallet Restored",
          description: `Connected to your primary wallet ${primaryWallet.account_id}`,
        });
      } else {
        debug.log('No active session found for primary wallet');
      }
    } catch (error) {
      debug.error('Failed to load primary wallet', error);
    }
  }, [primaryWallet, walletConnector, debug]);

  // Auth state listener
  useEffect(() => {
    debug.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      debug.log('Auth state changed', { event, userId: session?.user?.id });
      
      setCurrentUser(session?.user || null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        debug.log('User signed in, will load primary wallet');
        // Refetch primary wallet data and load it
        setTimeout(() => {
          refetchPrimaryWallet();
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        debug.log('User signed out');
        // Don't disconnect wallet automatically - let user choose
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      debug.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [debug, refetchPrimaryWallet]);

  // Load primary wallet when user logs in and primary wallet data is available
  useEffect(() => {
    if (currentUser && primaryWallet && !wallet.isConnected) {
      debug.log('User authenticated and primary wallet available, attempting to load');
      loadPrimaryWallet();
    }
  }, [currentUser, primaryWallet, wallet.isConnected, loadPrimaryWallet, debug]);

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

  // Attach event listeners safely
  const handleSessionEvents = useCallback((connector: DAppConnector) => {
    connectorRef.current = connector;
    const client = connector.walletConnectClient;
    if (!client) return;

    client.off("session_update", sessionUpdateHandler.current);
    client.off("session_delete", sessionDeleteHandler.current);
    client.on("session_update", sessionUpdateHandler.current);
    client.on("session_delete", sessionDeleteHandler.current);
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

        const targetLedger = import.meta.env.VITE_HEDERA_LEDGER === "mainnet" ? LedgerId.MAINNET : LedgerId.TESTNET;

        const connector = new DAppConnector(
          metadata,
          targetLedger,
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
              
              // Save restored wallet to database if user is authenticated
              await saveConnectedWallet(accountId, publicKey);
              
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      
      // Prefer modal lifecycle events if supported, fallback to observer
      const modalPromise = walletConnector.openModal();
      const observerPromise = new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          const modal = document.querySelector("[data-testid='wcm-modal'], .wcm-modal, [id*='walletconnect']");
          if (!modal) {
            observer.disconnect();
            resolve("MODAL_CLOSED");
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });

      await Promise.race([modalPromise, observerPromise]);
      
      // Poll for session establishment
      let session = null;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 200));
        session = walletConnector.walletConnectClient?.session?.getAll()[0];
        if (session) break;
      }
      if (!session) return;

      const accountId = getAccountIdFromSession(session);
      if (!accountId) throw new Error("No Testnet accounts found.");

      const walletType = (window as any).hashpack ? "HashPack" : "WalletConnect";
      const publicKey = await fetchPublicKey(accountId);

      setWallet({ isConnected: true, accountId, publicKey });
      
      // Save wallet to database if user is authenticated
      await saveConnectedWallet(accountId, publicKey);
      
      toast({ title: "Wallet Connected", description: `Connected to ${accountId} via ${walletType}` });
    } catch (error: any) {
      debug.error("Wallet connect failed", error);
      let errorMessage = "Failed to connect wallet.";
      if (error.message?.includes("No Testnet accounts")) {
        errorMessage = "No Testnet accounts found. Ensure your wallet has one.";
      } else if (error.message?.includes("User rejected")) {
        errorMessage = "Connection cancelled. Please approve in your wallet.";
      }
      toast({ title: "Connection Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (walletConnector?.walletConnectClient?.session) {
        const sessions = walletConnector.walletConnectClient.session.getAll();
        for (const session of sessions) {
          await walletConnector.walletConnectClient.session.delete(session.topic, {
            code: 6000,
            message: "User disconnected",
          });
        }
      }
      setWallet({ isConnected: false, accountId: null, publicKey: null });
      toast({ title: "Wallet Disconnected", description: "Your wallet has been disconnected" });
    } catch (error) {
      debug.error("Error disconnecting", error);
      toast({ title: "Disconnect Error", description: "Could not fully disconnect.", variant: "destructive" });
    }
  };

  const contextValue = useMemo(
    () => ({ wallet, connect, disconnect, isLoading, walletConnector }),
    [wallet, connect, disconnect, isLoading, walletConnector]
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};