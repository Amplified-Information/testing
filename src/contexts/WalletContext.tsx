import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { 
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { AccountBalanceQuery, Client, LedgerId } from "@hashgraph/sdk";
import { toast } from "@/hooks/use-toast";
import { useDebugger } from "@/hooks/useDebugger";
import { apiClient } from "@/utils/apiClient";

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

const WALLET_STORAGE_KEY = 'hashy_wallet_session';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const debug = useDebugger('WalletProvider');
  
  const [wallet, setWallet] = useState<WalletState>(() => {
    // Try to restore wallet state from localStorage
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        debug.log('Restored wallet state from storage', parsed);
        return { ...parsed, isConnected: false }; // Always start disconnected
      }
    } catch (error) {
      debug.error('Failed to restore wallet state', error);
    }
    return {
      isConnected: false,
      accountId: null,
      balance: null,
      publicKey: null,
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnector, setWalletConnector] = useState<DAppConnector | null>(null);

  // Save wallet state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } catch (error) {
      debug.error('Failed to save wallet state', error);
    }
  }, [wallet, debug]);

  // Session restoration and event handling
  const handleSessionEvents = useCallback((connector: DAppConnector) => {
    // Handle account changes
    connector.walletConnectClient?.on('session_update', (event) => {
      debug.log('Session updated', event);
      try {
        const session = connector.walletConnectClient?.session?.getAll()[0];
        if (session) {
          const accountId = session.namespaces?.hedera?.accounts?.[0]?.split(":")[2];
          if (accountId && accountId !== wallet.accountId) {
            debug.log('Account changed', { from: wallet.accountId, to: accountId });
            setWallet(prev => ({ ...prev, accountId }));
          }
        }
      } catch (error) {
        debug.error('Failed to handle session update', error);
      }
    });

    // Handle disconnection
    connector.walletConnectClient?.on('session_delete', () => {
      debug.log('Session deleted - disconnecting wallet');
      setWallet({
        isConnected: false,
        accountId: null,
        balance: null,
        publicKey: null,
      });
    });
  }, [debug, wallet.accountId]);

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
        
        // Try to restore existing session
        const sessions = connector.walletConnectClient?.session?.getAll() || [];
        if (sessions.length > 0 && wallet.accountId) {
          debug.log('Found existing session, attempting to restore');
          try {
            await updateBalance(wallet.accountId);
            setWallet(prev => ({ ...prev, isConnected: true }));
            debug.log('Session restored successfully');
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
  }, [debug, handleSessionEvents, wallet.accountId]);

  const updateBalance = useCallback(async (accountId: string) => {
    try {
      debug.log('Updating balance for account', accountId);
      const data = await apiClient.getHederaAccountBalance(accountId);
      const balanceInHbars = data.balance?.balance ? (data.balance.balance / 100000000) : 0;
      const formattedBalance = `${balanceInHbars.toFixed(2)} ℏ`;
      
      setWallet(prev => ({ ...prev, balance: formattedBalance }));
      debug.log('Balance updated successfully', formattedBalance);
      return formattedBalance;
    } catch (error) {
      debug.error('Failed to update balance', error);
      setWallet(prev => ({ ...prev, balance: "0 ℏ" }));
      return "0 ℏ";
    }
  }, [debug]);

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
      // Opens QR modal (mobile) or connects extension (desktop HashPack/Blade)
      await walletConnector.openModal();

      // Get session after successful connection
      const session = walletConnector.walletConnectClient?.session?.getAll()[0];
      if (!session) {
        throw new Error("No session established");
      }

      const accountId = session.namespaces?.hedera?.accounts?.[0]?.split(":")[2];
      if (!accountId) {
        throw new Error("No account ID found in session");
      }

      debug.log('Wallet connected successfully', accountId);

      // Update wallet state
      setWallet({
        isConnected: true,
        accountId,
        publicKey: null,
        balance: "0 ℏ",
      });

      // Fetch balance in the background
      const balance = await updateBalance(accountId);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId}`,
      });

      debug.log('Connection process completed', { accountId, balance });
    } catch (error: any) {
      debug.error("Wallet connect failed", error);
      toast({
        title: "Connection Error", 
        description: error.message || "Failed to connect wallet. Please try again.",
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
      balance: null,
      publicKey: null,
    });
    
    // Clear stored session
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      debug.error('Failed to clear stored session', error);
    }
    
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