import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { 
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { AccountBalanceQuery, Client, LedgerId } from "@hashgraph/sdk";
import { toast } from "@/hooks/use-toast";

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

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    balance: null,
    publicKey: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnector, setWalletConnector] = useState<DAppConnector | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
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
        setWalletConnector(connector);
      } catch (error) {
        console.error("Failed to initialize DAppConnector:", error);
        toast({
          title: "Initialization Failed",
          description: "Failed to initialize wallet connector",
          variant: "destructive",
        });
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (!walletConnector) return;

    setIsLoading(true);
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

      // Fetch balance using Mirror Node
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
        );
        const data = await response.json();
        const balanceInHbars = data.balance?.balance ? (data.balance.balance / 100000000) : 0;

        setWallet({
          isConnected: true,
          accountId,
          publicKey: null,
          balance: `${balanceInHbars.toFixed(2)} ℏ`,
        });

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accountId}`,
        });
      } catch (balanceError) {
        // Set wallet as connected even if balance fetch fails
        setWallet({
          isConnected: true,
          accountId,
          publicKey: null,
          balance: "0 ℏ",
        });

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accountId} (balance unavailable)`,
        });
      }
    } catch (error: any) {
      console.error("❌ Wallet connect failed:", error);
      toast({
        title: "Connection Error", 
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (walletConnector?.walletConnectClient?.session) {
        const sessions = walletConnector.walletConnectClient.session.getAll();
        for (const session of sessions) {
          await walletConnector.walletConnectClient.session.delete(
            session.topic,
            { code: 6000, message: "User disconnected" }
          );
        }
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
    
    setWallet({
      isConnected: false,
      accountId: null,
      balance: null,
      publicKey: null,
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
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