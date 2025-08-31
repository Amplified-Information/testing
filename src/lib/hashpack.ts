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
      // Comprehensive debugging of window object
      console.log('=== HashPack Detection Debug ===');
      console.log('window.hashpack:', (window as any).hashpack);
      console.log('window.HashPack:', (window as any).HashPack);
      console.log('window.hashconnect:', (window as any).hashconnect);
      console.log('window.hashConnect:', (window as any).hashConnect);
      
      // Check all possible HashPack-related properties
      const allWindowKeys = Object.keys(window as any);
      const hashRelatedKeys = allWindowKeys.filter(key => 
        key.toLowerCase().includes('hash') || 
        key.toLowerCase().includes('pack') || 
        key.toLowerCase().includes('hedera') ||
        key.toLowerCase().includes('wallet')
      );
      console.log('All hash/pack/hedera/wallet related keys:', hashRelatedKeys);
      
      // Check if any events are fired by the extension
      window.addEventListener('hashpack-loaded', () => {
        console.log('HashPack loaded event fired');
      });
      
      // Check document ready state
      console.log('Document ready state:', document.readyState);
      
      // Check for extension specific indicators
      const extensionIndicators = [
        'hashpack', 'HashPack', 'hashconnect', 'hashConnect',
        'hedera', 'Hedera', 'hederaWallet', 'HederaWallet'
      ];
      
      extensionIndicators.forEach(indicator => {
        if ((window as any)[indicator]) {
          console.log(`Found ${indicator}:`, (window as any)[indicator]);
        }
      });
      
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
      console.log('=== End HashPack Detection Debug ===');
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
      console.log('=== HashPack Connection Attempt ===');
      
      // Wait a moment for extension to load if needed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check multiple possible locations for HashPack
      const possibleLocations = [
        (window as any).hashpack,
        (window as any).HashPack,
        (window as any).hashconnect,
        (window as any).hashConnect,
        (window as any).hedera,
        (window as any).Hedera
      ];
      
      console.log('Checking possible HashPack locations:', possibleLocations.map(loc => !!loc));
      
      // Try to find any available extension
      let hashpackExtension = null;
      for (const location of possibleLocations) {
        if (location && typeof location === 'object') {
          console.log('Found potential HashPack extension:', location);
          hashpackExtension = location;
          break;
        }
      }
      
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