import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';

export const HEDERA_CONFIG = {
  network: import.meta.env.VITE_HEDERA_NETWORK || 'testnet',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://testnet.hashio.io/api',
  mirrorNodeUrl: import.meta.env.VITE_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1',
  chainId: import.meta.env.VITE_CHAIN_ID || '296',
};

export class HederaService {
  private client: Client;

  constructor() {
    this.client = Client.forTestnet();
  }

  getClient() {
    return this.client;
  }

  async getAccountBalance(accountId: string) {
    try {
      // Use mirror node API for now since direct client methods may not be available
      const response = await fetch(`${HEDERA_CONFIG.mirrorNodeUrl}/accounts/${accountId}`);
      const data = await response.json();
      return data.balance?.balance || '0';
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  async getAccountInfo(accountId: string) {
    try {
      const response = await fetch(`${HEDERA_CONFIG.mirrorNodeUrl}/accounts/${accountId}`);
      const data = await response.json();
      return {
        accountId: data.account,
        balance: data.balance?.balance || '0',
        publicKey: data.key?.key || null
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }
}

export const hederaService = new HederaService();