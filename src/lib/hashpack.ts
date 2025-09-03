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
      console.log('=== HashPack Detection Debug ===');
      console.log('Initialize called at:', new Date().toISOString());
      console.log('Document ready state:', document.readyState);
      
      // Wait for DOM to be ready and extensions to load
      await this.waitForExtensions();
      
      // Comprehensive debugging after waiting
      this.debugWindowObject();
      
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

  private async waitForExtensions(): Promise<void> {
    console.log('Waiting for extensions to load...');
    
    // Check multiple times with increasing delays
    const maxAttempts = 10;
    const delays = [100, 200, 500, 1000, 2000];
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Extension check attempt ${attempt + 1}/${maxAttempts}`);
      
      const found = this.checkForHashPack();
      if (found) {
        console.log('HashPack found on attempt:', attempt + 1);
        return;
      }
      
      const delay = delays[Math.min(attempt, delays.length - 1)];
      console.log(`No HashPack found, waiting ${delay}ms before next check...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log('HashPack not found after all attempts');
  }

  private checkForHashPack(): boolean {
    console.log('🔍 Checking for HashPack extension...');
    
    // Check if HashPack extension is installed (most reliable method)
    try {
      if ((window as any).hashpack) {
        console.log('✅ HashPack found at window.hashpack');
        return true;
      }
      
      // Check for HashConnect integration
      if ((window as any).hashconnect) {
        console.log('✅ HashConnect found at window.hashconnect');
        return true;
      }

      // Check all possible locations as fallback
      const possibleLocations = [
        'HashPack', 'hashConnect', 'hedera', 'Hedera', 
        'hederaWallet', 'HederaWallet'
      ];
      
      for (const location of possibleLocations) {
        if ((window as any)[location]) {
          console.log(`✅ HashPack found at window.${location}`);
          return true;
        }
      }
    } catch (error) {
      console.log('❌ Error checking for HashPack:', error);
    }
    
    console.log('❌ HashPack extension not found');
    console.log('💡 Make sure HashPack extension is:');
    console.log('   1. Installed from https://hashpack.app');
    console.log('   2. Enabled in browser extensions');
    console.log('   3. Page has been refreshed after installation');
    
    return false;
  }

  private debugWindowObject(): void {
    console.log('=== Safe HashPack Detection Debug ===');
    
    // Detect if running in sandboxed environment
    const isSandboxed = this.detectSandboxEnvironment();
    console.log('Running in sandboxed environment:', isSandboxed);
    
    // Check specific HashPack locations safely
    const hashpackLocations = [
      'hashpack', 'HashPack', 'hashconnect', 'hashConnect', 
      'hedera', 'Hedera', 'hederaWallet', 'HederaWallet'
    ];
    
    hashpackLocations.forEach(location => {
      try {
        const value = (window as any)[location];
        console.log(`window.${location}:`, typeof value, !!value);
        
        if (value && typeof value === 'object') {
          console.log(`  - Has connect method:`, typeof value.connect === 'function');
          console.log(`  - Has requestAccount method:`, typeof value.requestAccount === 'function');
          console.log(`  - Has enable method:`, typeof value.enable === 'function');
        }
      } catch (error) {
        console.log(`window.${location}: Access blocked (SecurityError)`);
      }
    });
    
    // Check for browser extension API
    try {
      console.log('Chrome extension API available:', !!(window as any).chrome);
    } catch (error) {
      console.log('Chrome extension API: Access blocked');
    }
    
    if (isSandboxed) {
      console.log('⚠️  Running in sandboxed environment - HashPack extension may not be accessible');
      console.log('💡 To test HashPack connection, try opening this app in a new browser tab');
    }
    
    console.log('=== End Safe HashPack Detection Debug ===');
  }

  private detectSandboxEnvironment(): boolean {
    try {
      // Check if running in iframe
      const inIframe = window !== window.top;
      
      // Check for Lovable/sandbox-specific indicators
      const isLovableSandbox = window.location.hostname.includes('lovable') || 
                               window.location.hostname.includes('sandbox');
      
      // Check for other sandbox indicators
      const hasSandboxAttribute = document.querySelector('iframe[sandbox]') !== null;
      
      return inIframe || isLovableSandbox || hasSandboxAttribute;
    } catch (error) {
      // If we can't access window.top, we're definitely in a sandboxed iframe
      return true;
    }
  }

  async connect(): Promise<void> {
    try {
      console.log('🚀 Starting HashPack Connection...');
      
      // Force a fresh check for HashPack
      const hasExtension = this.checkForHashPack();
      
      if (!hasExtension) {
        const installMessage = `
HashPack extension not found! Please:

1. Install HashPack extension from: https://hashpack.app
2. Enable the extension in your browser
3. Refresh this page after installation
4. Make sure HashPack is unlocked

If you just installed HashPack, please refresh this page and try again.
        `;
        console.error(installMessage);
        throw new Error('HashPack extension not found. Please install from hashpack.app and refresh the page.');
      }

      // Try HashPack connection
      let hashpackExtension = (window as any).hashpack || (window as any).hashconnect;
      
      if (!hashpackExtension) {
        // Fallback check
        const fallbackLocations = [
          (window as any).HashPack,
          (window as any).hashConnect,
          (window as any).hedera,
          (window as any).Hedera
        ];
        
        for (const location of fallbackLocations) {
          if (location && typeof location === 'object') {
            hashpackExtension = location;
            break;
          }
        }
      }

      if (!hashpackExtension) {
        throw new Error('HashPack extension object not accessible. Please refresh the page and try again.');
      }

      console.log('🔗 Attempting to connect with HashPack...');
      
      try {
        let response;
        
        // Try different connection methods
        if (typeof hashpackExtension.connect === 'function') {
          console.log('Using hashpackExtension.connect()');
          response = await hashpackExtension.connect();
        } else if (typeof hashpackExtension.requestAccount === 'function') {
          console.log('Using hashpackExtension.requestAccount()');
          response = await hashpackExtension.requestAccount();
        } else if (typeof hashpackExtension.enable === 'function') {
          console.log('Using hashpackExtension.enable()');
          response = await hashpackExtension.enable();
        } else {
          console.error('Available methods:', Object.keys(hashpackExtension));
          throw new Error('No compatible connection method found in HashPack extension');
        }
        
        console.log('📝 HashPack response:', response);
        
        // Handle different response formats
        let accountIds = [];
        
        if (response && response.accountId) {
          accountIds = [response.accountId];
        } else if (response && response.accountIds) {
          accountIds = response.accountIds;
        } else if (response && Array.isArray(response)) {
          accountIds = response;
        } else if (typeof response === 'string') {
          accountIds = [response];
        }
        
        if (accountIds.length === 0) {
          throw new Error('No account IDs returned from HashPack. Please make sure your wallet is unlocked.');
        }
        
        // Update state
        this.state = {
          ...this.state,
          isConnected: true,
          accountIds: accountIds
        };
        
        console.log('✅ HashPack connected successfully!', this.state);
        
        if (this.eventCallbacks.onConnect) {
          this.eventCallbacks.onConnect(this.state);
        }
        
      } catch (connectionError) {
        console.error('💥 HashPack connection error:', connectionError);
        
        let errorMessage = 'Failed to connect to HashPack wallet.';
        
        if (connectionError instanceof Error) {
          if (connectionError.message.includes('User rejected')) {
            errorMessage = 'Connection was cancelled by user.';
          } else if (connectionError.message.includes('unlock')) {
            errorMessage = 'Please unlock your HashPack wallet and try again.';
          } else {
            errorMessage = `HashPack error: ${connectionError.message}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('🚨 HashPack connection failed:', error);
      
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