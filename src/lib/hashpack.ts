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
      // Generate a unique topic for this session
      this.state.topic = `hashymarket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pairing string
      const metadata = {
        name: "HashyMarket",
        description: "Decentralized prediction markets on Hedera Hashgraph",
        icons: [window.location.origin + "/favicon.ico"],
        url: window.location.origin
      };
      
      this.state.pairingString = `hashpack://pair?metadata=${btoa(JSON.stringify(metadata))}&network=testnet&topic=${this.state.topic}`;
      
      console.log('HashPack connector initialized');
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
      // Check if HashPack extension is available
      if (typeof window !== 'undefined' && (window as any).hashconnect) {
        console.log('HashPack extension detected, connecting...');
        
        // Use HashPack extension API
        const hashconnect = (window as any).hashconnect;
        
        try {
          // Request connection from HashPack
          const response = await hashconnect.connect(this.state.topic, {
            name: "HashyMarket",
            description: "Decentralized prediction markets on Hedera Hashgraph",
            url: window.location.origin,
            icons: [window.location.origin + "/favicon.ico"]
          });
          
          console.log('HashPack connection response:', response);
          
          if (response && response.accountIds && response.accountIds.length > 0) {
            this.state = {
              ...this.state,
              isConnected: true,
              accountIds: response.accountIds
            };
            
            if (this.eventCallbacks.onConnect) {
              this.eventCallbacks.onConnect(this.state);
            }
          } else {
            throw new Error('No accounts returned from HashPack');
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