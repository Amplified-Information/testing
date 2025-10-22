import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';

export const HEDERA_CONFIG = {
  network: import.meta.env.VITE_HEDERA_NETWORK || 'testnet',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://testnet.hashio.io/api',
  mirrorNodeUrl: import.meta.env.VITE_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com/api/v1',
};

export class HederaService {
  private client: Client;

  constructor() {
    this.client = Client.forTestnet();
  }

  getClient() {
    return this.client;
  }
}

export const hederaService = new HederaService();