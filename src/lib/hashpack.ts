export interface HashPackWalletState {
  isConnected: boolean;
  accountIds: string[];
  network: string;
  topic: string;
  pairingString: string;
}

export class HashPackConnector {
  private state: HashPackWalletState;
  private eventCallbacks: {
    onConnect?: (state: HashPackWalletState) => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  } = {};

  constructor() {
    this.state = {
      isConnected: false,
      accountIds: [],
      network: 'testnet',
      topic: '',
      pairingString: ''
    };
  }

  async initialize(): Promise<void> {
    try {
      // Debug what's available in window object
      console.log('Window hashpack object:', (window as any).hashpack);
      console.log('Window hashconnect object:', (window as any).hashconnect);
      console.log('Window HashPack object:', (window as any).HashPack);
      console.log('Available wallet objects:', Object.keys((window as any)).filter(key => key.toLowerCase().includes('hash') || key.toLowerCase().includes('wallet')));
      
      // Generate a unique topic for this session
      this.state.topic = `hashymarket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pairing string for mobile connections
      const metadata = {
        name: "HashyMarket",
        description: "Decentralized prediction markets on Hedera Hashgraph",
        icons: [window.location.origin + "/favicon.ico"],
        url: window.location.origin
      };
      
      this.state.pairingString = `hashpack://pair?metadata=${btoa(JSON.stringify(metadata))}&network=testnet&topic=${this.state.topic}`;
      
      console.log('HashPack connector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      if (this.eventCallbacks.onError) {
        this.eventCallbacks.onError(error as Error);
      }
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      // Check for various HashPack extension objects
      const hashpackExtension = (window as any).hashpack || (window as any).HashPack;
      
      console.log('HashPack extension available:', !!hashpackExtension);
      console.log('HashPack extension object:', hashpackExtension);
      
      if (hashpackExtension) {
        console.log('HashPack extension detected, attempting connection...');
        
        try {
          // Try to connect using the HashPack extension
          let response;
          
          if (hashpackExtension.connect) {
            response = await hashpackExtension.connect();
          } else if (hashpackExtension.requestAccount) {
            response = await hashpackExtension.requestAccount();
          } else {
            throw new Error('HashPack extension found but no known connection method available');
          }
          
          console.log('HashPack connection response:', response);
          
          if (response && response.accountId) {
            // Handle single account response
            this.state = {
              ...this.state,
              isConnected: true,
              accountIds: [response.accountId]
            };
          } else if (response && response.accountIds && response.accountIds.length > 0) {
            // Handle multiple accounts response
            this.state = {
              ...this.state,
              isConnected: true,
              accountIds: response.accountIds
            };
          } else {
            throw new Error('No accounts returned from HashPack extension');
          }
          
          if (this.eventCallbacks.onConnect) {
            this.eventCallbacks.onConnect(this.state);
          }
          
        } catch (connectionError) {
          console.error('HashPack connection failed:', connectionError);
          throw new Error('Failed to connect to HashPack wallet. Please make sure HashPack is unlocked and try again.');
        }
        
      } else {
        console.log('HashPack extension not detected');
        
        // Show error with installation instructions
        const error = new Error('HashPack wallet extension not found. Please install HashPack browser extension from hashpack.app');
        if (this.eventCallbacks.onError) {
          this.eventCallbacks.onError(error);
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to connect to HashPack:', error);
      if (this.eventCallbacks.onError) {
        this.eventCallbacks.onError(error as Error);
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.state = {
        isConnected: false,
        accountIds: [],
        network: 'testnet',
        topic: '',
        pairingString: this.state.pairingString
      };
      
      if (this.eventCallbacks.onDisconnect) {
        this.eventCallbacks.onDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect from HashPack:', error);
      throw error;
    }
  }

  getAccountId(): string | null {
    return this.state.isConnected && this.state.accountIds.length > 0 
      ? this.state.accountIds[0] 
      : null;
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getPairingString(): string {
    return this.state.pairingString;
  }

  onConnect(callback: (state: HashPackWalletState) => void) {
    this.eventCallbacks.onConnect = callback;
  }

  onDisconnect(callback: () => void) {
    this.eventCallbacks.onDisconnect = callback;
  }

  onError(callback: (error: Error) => void) {
    this.eventCallbacks.onError = callback;
  }
}

export const hashPackConnector = new HashPackConnector();