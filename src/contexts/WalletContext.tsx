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

  const connect = async (retryCount = 0) => {
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
    debug.log('Initiating wallet connection', { attempt: retryCount + 1 });
    
    try {
      // Show connection progress message
      toast({
        title: "Opening wallet selection...",
        description: "Choose your preferred wallet from the options.",
      });
      
      // Enhanced modal handling with better error detection
      const connectWithRetry = async () => {
        let lastError = null;
        
        try {
          // Serialize any potential URL objects to prevent DataCloneError
          const safeMetadata = {
            name: "Hashy Markets",
            description: "Prediction Markets on Hedera",
            url: window.location.origin.toString(), // Ensure string serialization
            icons: [""],
          };
          
          // Check for existing WalletConnect issues before opening modal
          const existingModals = document.querySelectorAll('[data-testid="wcm-modal"], .wcm-modal, [id*="walletconnect"]');
          if (existingModals.length > 0) {
            debug.log('Cleaning up existing modals');
            existingModals.forEach(modal => {
              try {
                modal.remove();
              } catch (e) {
                debug.log('Could not remove modal element', e);
              }
            });
          }
          
          // Enhanced postMessage error handling wrapper
          const originalPostMessage = window.postMessage;
          const postMessageErrors: any[] = [];
          
          window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
            try {
              // Serialize objects to prevent DataCloneError
              const serializedMessage = typeof message === 'object' ? 
                JSON.parse(JSON.stringify(message, (key, value) => {
                  // Convert URL objects to strings
                  if (value && typeof value === 'object' && value.constructor === URL) {
                    return value.toString();
                  }
                  return value;
                })) : message;
              
              return originalPostMessage.call(this, serializedMessage, targetOrigin, transfer);
            } catch (error) {
              debug.error('postMessage serialization error:', error);
              postMessageErrors.push(error);
              // Try with original message as fallback
              return originalPostMessage.call(this, message, targetOrigin, transfer);
            }
          };
          
          // Attempt to open modal with enhanced error handling
          const modalPromise = walletConnector.openModal();
          
          // Shorter timeout for better UX
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("MODAL_TIMEOUT"));
            }, 8000); // 8 second timeout
          });
          
          // Enhanced modal state detection
          const modalStatePromise = new Promise((resolve, reject) => {
            let isResolved = false;
            let pollCount = 0;
            const maxPolls = 40; // 8 seconds of polling
            
            const checkModalState = () => {
              if (isResolved) return;
              pollCount++;
              
              // Check for postMessage errors
              if (postMessageErrors.length > 0) {
                isResolved = true;
                const error = postMessageErrors[0];
                if (error.name === 'DataCloneError') {
                  reject(new Error('DATA_CLONE_ERROR: Failed to serialize wallet communication data'));
                } else {
                  reject(error);
                }
                return;
              }
              
              // Check modal visibility
              const modalElements = document.querySelectorAll('[data-testid="wcm-modal"], .wcm-modal, [id*="walletconnect"]');
              const hasVisibleModal = Array.from(modalElements).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
              });
              
              // If modal disappeared quickly, likely an error
              if (modalElements.length === 0 && pollCount > 2) {
                isResolved = true;
                debug.log('Modal disappeared quickly - likely connection issue');
                resolve('MODAL_CLOSED_EARLY');
                return;
              }
              
              // Continue polling
              if (pollCount < maxPolls) {
                setTimeout(checkModalState, 200);
              } else {
                isResolved = true;
                resolve('POLL_TIMEOUT');
              }
            };
            
            // Start polling after brief delay
            setTimeout(checkModalState, 500);
          });
          
          // Race conditions with better handling
          const result = await Promise.race([
            modalPromise,
            timeoutPromise,
            modalStatePromise
          ]).finally(() => {
            // Restore original postMessage
            window.postMessage = originalPostMessage;
          });
          
          // Handle different result types
          if (result === 'MODAL_CLOSED_EARLY') {
            throw new Error('MODAL_CLOSED_EARLY');
          }
          
          return result;
          
        } catch (error: any) {
          lastError = error;
          
          // Handle specific error types
          if (error.message?.includes('DATA_CLONE_ERROR')) {
            debug.error('DataCloneError detected - postMessage serialization failed');
            throw new Error('SERIALIZATION_ERROR');
          } else if (error.message === 'MODAL_CLOSED_EARLY') {
            debug.log('Modal closed early - possible browser/extension interference');
            throw new Error('MODAL_INTERFERENCE');
          }
          
          throw error;
        }
      };
      
      // Attempt connection with retry logic
      await connectWithRetry();
      
      // Enhanced session polling with exponential backoff
      let session = null;
      let attempts = 0;
      const maxAttempts = 15; // 3+ seconds total wait time
      
      while (attempts < maxAttempts && !session) {
        const delay = Math.min(200 + (attempts * 50), 500); // Exponential backoff up to 500ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          session = walletConnector.walletConnectClient?.session?.getAll()[0];
        } catch (error) {
          debug.error('Error getting session:', error);
        }
        
        attempts++;
      }
      
      // Enhanced session validation
      if (!session) {
        debug.log('No session found after enhanced polling - connection may have failed');
        
        // Check if it was a user cancellation vs technical error
        const hasRecentErrors = document.querySelector('.wcm-error, [data-testid="wcm-error"]');
        if (hasRecentErrors) {
          throw new Error('TECHNICAL_ERROR');
        }
        
        return; // Likely user cancellation
      }

      const accountId = getAccountIdFromSession(session);
      if (!accountId) {
        throw new Error("No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account.");
      }

      // Detect wallet type after successful connection
      const isHashPackInstalled = !!(window as any).hashpack;
      const walletType = isHashPackInstalled ? 'HashPack' : 'wallet';
      
      // Auto-fetch public key with retry
      debug.log('Fetching public key for account:', accountId);
      let publicKey = null;
      try {
        publicKey = await fetchPublicKey(accountId);
      } catch (pkError) {
        debug.error('Failed to fetch public key, continuing without it:', pkError);
      }

      debug.log('Wallet connected successfully', { accountId, publicKey: !!publicKey, walletType });

      // Update wallet state
      setWallet({
        isConnected: true,
        accountId,
        publicKey,
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId} via ${walletType}${publicKey ? ' with public key' : ''}`,
      });

      debug.log('Connection process completed successfully');
      
    } catch (error: any) {
      debug.error("Wallet connect failed", error);
      
      // Enhanced error handling with retry logic
      if ((error.message === "MODAL_TIMEOUT" || 
           error.message === "SERIALIZATION_ERROR" ||
           error.message === "MODAL_INTERFERENCE" ||
           error.message === "TECHNICAL_ERROR") && retryCount < 2) {
        
        debug.log(`Connection failed, retrying... (${retryCount + 1}/3)`);
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Recursive retry
        return connect(retryCount + 1);
      }
      
      // Final error handling after retries exhausted
      let errorMessage = "Failed to connect wallet. Please try again.";
      let shouldShowError = true;
      
      if (error.message === "MODAL_TIMEOUT") {
        errorMessage = "Connection timed out. Please ensure your wallet is unlocked and try again.";
      } else if (error.message === "SERIALIZATION_ERROR") {
        errorMessage = "Browser compatibility issue detected. Please try refreshing the page or using a different browser.";
      } else if (error.message === "MODAL_INTERFERENCE") {
        errorMessage = "Connection interference detected. Please disable ad blockers or browser extensions and try again.";
      } else if (error.message?.includes("No Testnet accounts found") || 
                 error.message?.includes("no appropriate accounts")) {
        errorMessage = "No Testnet accounts found. Please ensure your wallet is connected to Hedera Testnet and has at least one testnet account.";
      } else if (error.message?.includes("User rejected")) {
        shouldShowError = false; // User intentionally cancelled
      }
      
      if (shouldShowError) {
        toast({
          title: "Connection Error", 
          description: errorMessage,
          variant: "destructive",
        });
      }
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