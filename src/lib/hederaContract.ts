import { 
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  HbarUnit,
  TransactionReceipt,
  TransactionResponse
} from '@hashgraph/sdk';

export interface ContractCallResult {
  success: boolean;
  transactionId: string;
  receipt?: TransactionReceipt;
  error?: string;
}

export interface LimitOrderParams {
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  maker: string;
}

/**
 * Service for interacting with Hedera Smart Contracts for CLOB operations
 */
export class HederaContractService {
  private debugEnabled = import.meta.env.MODE === 'development';

  private log(message: string, data?: any) {
    if (this.debugEnabled) {
      console.log(`[HederaContractService] ${message}`, data);
    }
  }

  private error(message: string, data?: any) {
    console.error(`[HederaContractService] ${message}`, data);
  }

  /**
   * Submit a limit order to the CLOB smart contract
   */
  async submitLimitOrder(
    walletConnector: any,
    contractId: string,
    params: LimitOrderParams
  ): Promise<ContractCallResult> {
    try {
      this.log('Submitting limit order to smart contract', { contractId, params });

      if (!walletConnector?.signers?.[0]) {
        throw new Error('Wallet not connected or signer not available');
      }

      // Create contract call parameters
      const functionParams = new ContractFunctionParameters()
        .addString(params.marketId)
        .addUint8(params.side === 'BUY' ? 0 : 1)
        .addUint256(Math.round(params.price * 100)) // Price in ticks (cents)
        .addUint256(params.quantity)
        .addString(params.maker);

      // Create contract execution transaction
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(300000) // Adjust gas limit as needed
        .setFunction('submitLimitOrder', functionParams)
        .setMaxTransactionFee(new Hbar(2)); // Max 2 HBAR fee

      this.log('Executing contract transaction via wallet');

      // Execute transaction through wallet connector
      const signer = walletConnector.signers[0];
      const txResponse = await transaction.executeWithSigner(signer) as TransactionResponse;
      
      this.log('Transaction submitted', { transactionId: txResponse.transactionId.toString() });

      // Get receipt
      const receipt = await txResponse.getReceipt(signer.getAccountId().client);
      
      this.log('Transaction receipt received', { 
        status: receipt.status.toString(),
        transactionId: txResponse.transactionId.toString() 
      });

      return {
        success: receipt.status.toString() === 'SUCCESS',
        transactionId: txResponse.transactionId.toString(),
        receipt
      };

    } catch (error: any) {
      this.error('Failed to submit limit order to contract', error);
      return {
        success: false,
        transactionId: '',
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel a limit order on the smart contract
   */
  async cancelLimitOrder(
    walletConnector: any,
    contractId: string,
    orderId: string,
    accountId: string
  ): Promise<ContractCallResult> {
    try {
      this.log('Cancelling order on smart contract', { contractId, orderId, accountId });

      if (!walletConnector?.signers?.[0]) {
        throw new Error('Wallet not connected or signer not available');
      }

      const functionParams = new ContractFunctionParameters()
        .addString(orderId)
        .addString(accountId);

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(200000)
        .setFunction('cancelOrder', functionParams)
        .setMaxTransactionFee(new Hbar(1));

      const signer = walletConnector.signers[0];
      const txResponse = await transaction.executeWithSigner(signer) as TransactionResponse;
      
      this.log('Cancel transaction submitted', { transactionId: txResponse.transactionId.toString() });

      const receipt = await txResponse.getReceipt(signer.getAccountId().client);

      return {
        success: receipt.status.toString() === 'SUCCESS',
        transactionId: txResponse.transactionId.toString(),
        receipt
      };

    } catch (error: any) {
      this.error('Failed to cancel order on contract', error);
      return {
        success: false,
        transactionId: '',
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get order details from smart contract
   */
  async getOrderDetails(
    walletConnector: any,
    contractId: string,
    orderId: string
  ): Promise<any> {
    try {
      this.log('Fetching order details from contract', { contractId, orderId });

      if (!walletConnector?.signers?.[0]) {
        throw new Error('Wallet not connected');
      }

      const functionParams = new ContractFunctionParameters()
        .addString(orderId);

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction('getOrder', functionParams)
        .setMaxTransactionFee(new Hbar(0.5));

      const signer = walletConnector.signers[0];
      const txResponse = await transaction.executeWithSigner(signer) as TransactionResponse;
      const receipt = await txResponse.getReceipt(signer.getAccountId().client);

      // Parse contract response
      // Note: You'll need to adjust this based on your contract's return type
      return receipt;

    } catch (error: any) {
      this.error('Failed to get order details from contract', error);
      throw error;
    }
  }

  /**
   * Query contract balance/collateral for an account
   */
  async getAccountCollateral(
    walletConnector: any,
    contractId: string,
    accountId: string
  ): Promise<number> {
    try {
      this.log('Fetching account collateral from contract', { contractId, accountId });

      if (!walletConnector?.signers?.[0]) {
        throw new Error('Wallet not connected');
      }

      const functionParams = new ContractFunctionParameters()
        .addString(accountId);

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction('getCollateral', functionParams)
        .setMaxTransactionFee(new Hbar(0.5));

      const signer = walletConnector.signers[0];
      const txResponse = await transaction.executeWithSigner(signer) as TransactionResponse;
      const receipt = await txResponse.getReceipt(signer.getAccountId().client);

      // Parse the collateral amount from receipt
      // Adjust based on your contract's return format
      return 0; // Placeholder

    } catch (error: any) {
      this.error('Failed to get account collateral from contract', error);
      throw error;
    }
  }
}

export const hederaContractService = new HederaContractService();
