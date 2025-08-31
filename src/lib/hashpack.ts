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
      // Generate a mock pairing string for demonstration
      this.state.pairingString = `hashpack://pair?metadata=${btoa(JSON.stringify({
        name: "HashyMarket",
        description: "Decentralized prediction markets on Hedera Hashgraph",
        url: window.location.origin
      }))}&network=testnet`;
      
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
      // Check if HashPack extension is installed
      if (typeof window !== 'undefined' && (window as any).hashconnect) {
        // Real HashPack connection would go here
        console.log('HashPack extension detected');
      } else {
        // Show instructions to install HashPack
        console.log('HashPack extension not detected. Please install HashPack wallet.');
        
        // For demo purposes, simulate a connection
        setTimeout(() => {
          this.state = {
            ...this.state,
            isConnected: true,
            accountIds: ['0.0.1234567'], // Mock account ID
            topic: 'demo-topic'
          };
          
          if (this.eventCallbacks.onConnect) {
            this.eventCallbacks.onConnect(this.state);
          }
        }, 2000);
        
        return;
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