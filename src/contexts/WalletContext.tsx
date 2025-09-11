import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
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
  walletConnector: null; // Mock mode - no real connector
  extendSession: () => void;
  sessionTimeRemaining: number | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const debug = useDebugger('WalletProvider');
  
  // MOCK WALLET STATE - Always connected for off-chain development
  const [wallet] = useState<WalletState>({
    isConnected: true,
    accountId: "0.0.12345", // Mock account ID for testing
    publicKey: "mock_public_key_for_testing",
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Simple mock extension function
  const extendSession = useCallback(() => {
    debug.log('Mock session extension');
    toast({
      title: "Mock Session",
      description: "Session management disabled in development mode",
    });
  }, [debug]);

  const connect = async () => {
    // MOCK CONNECTION - Wallet is always connected in development mode
    debug.log('Mock wallet connection - wallet functionality suspended');
    toast({
      title: "Wallet Connected (Mock)",
      description: "Using mock wallet for off-chain development",
    });
    return;
  };

  const disconnect = async () => {
    try {
      // MOCK DISCONNECT - Reset to mock connected state
      debug.log('Mock wallet disconnect - resetting to mock state');
      
      // Don't actually disconnect in mock mode, just show feedback
      toast({ 
        title: "Mock Disconnect", 
        description: "Wallet remains connected in development mode" 
      });
      
    } catch (error) {
      debug.error("Mock disconnect", error);
    }
  };

  // Mock context value with simplified state
  const contextValue = useMemo(
    () => ({ 
      wallet, 
      connect, 
      disconnect, 
      isLoading, 
      walletConnector: null, // Mock mode - no real connector
      extendSession,
      sessionTimeRemaining: null, // Mock mode - no session timeout
    }),
    [wallet, isLoading, extendSession, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      {/* Mock mode - no inactivity dialog */}
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