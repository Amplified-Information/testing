import { CLOBOrder } from '@/types/clob';

/**
 * EIP-712 Signing Service for CLOB Orders
 * Enables off-chain order signing with zero gas fees for users
 */

// EIP-712 Domain
const DOMAIN = {
  name: 'Hedera CLOB',
  version: '1',
  chainId: 296, // Hedera testnet
  verifyingContract: '0x0000000000000000000000000000000000000000', // Will be set to settlement contract
};

// EIP-712 Order Type Definition
const ORDER_TYPE = {
  Order: [
    { name: 'domain', type: 'string' },
    { name: 'marketId', type: 'string' },
    { name: 'maker', type: 'string' },
    { name: 'side', type: 'string' },
    { name: 'priceTicks', type: 'uint256' },
    { name: 'qty', type: 'uint256' },
    { name: 'tif', type: 'string' },
    { name: 'expiry', type: 'uint256' },
    { name: 'nonce', type: 'string' },
    { name: 'maxCollateral', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

class EIP712SigningService {
  /**
   * Generate EIP-712 typed data for CLOB order
   */
  getTypedData(order: CLOBOrder) {
    return {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Order: ORDER_TYPE.Order,
      },
      primaryType: 'Order',
      domain: DOMAIN,
      message: {
        domain: order.domain,
        marketId: order.marketId,
        maker: order.maker,
        side: order.side,
        priceTicks: order.priceTicks.toString(),
        qty: order.qty.toString(),
        tif: order.tif,
        expiry: order.expiry.toString(),
        nonce: order.nonce,
        maxCollateral: order.maxCollateral.toString(),
        timestamp: order.timestamp.toString(),
      },
    };
  }

  /**
   * Generate message hash from order (for signature verification)
   */
  getMessageHash(order: CLOBOrder): string {
    const message = JSON.stringify({
      domain: order.domain,
      marketId: order.marketId,
      maker: order.maker,
      side: order.side,
      priceTicks: order.priceTicks,
      qty: order.qty,
      tif: order.tif,
      expiry: order.expiry,
      nonce: order.nonce,
      maxCollateral: order.maxCollateral,
      timestamp: order.timestamp,
    });

    // Simple hash for now (in production, use keccak256)
    return this.simpleHash(message);
  }

  /**
   * Sign CLOB order using wallet's signMessage API
   */
  async signOrder(
    order: CLOBOrder,
    walletConnector: any
  ): Promise<{ signature: string; msgHash: string }> {
    if (!walletConnector) {
      throw new Error('Wallet connector not available');
    }

    try {
      // Generate message hash
      const msgHash = this.getMessageHash(order);

      // For Hedera wallets, we use signMessage which is simpler than EIP-712
      // The wallet will show a message signing prompt (no gas fees)
      const messageToSign = `Sign CLOB Order\n\nMarket: ${order.marketId}\nSide: ${order.side}\nPrice: ${order.priceTicks / 100}\nQuantity: ${order.qty}\nNonce: ${order.nonce}`;

      // Sign the message using wallet connector
      const signature = await walletConnector.signMessage(messageToSign);

      return {
        signature,
        msgHash,
      };
    } catch (error) {
      console.error('Failed to sign order:', error);
      throw new Error('Order signing failed: ' + (error as Error).message);
    }
  }

  /**
   * Verify signature matches order and signer
   */
  verifySignature(
    order: CLOBOrder,
    signature: string,
    expectedSigner: string
  ): boolean {
    // This is a simplified verification
    // In production, you would:
    // 1. Recover signer address from signature
    // 2. Verify it matches expectedSigner
    // 3. Verify msgHash matches order content
    
    if (!signature || signature.length < 10) {
      return false;
    }

    // Basic validation
    if (order.maker !== expectedSigner) {
      return false;
    }

    return true;
  }

  /**
   * Simple hash function (replace with keccak256 in production)
   */
  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Validate order before signing
   */
  validateOrderBeforeSigning(order: CLOBOrder): { valid: boolean; error?: string } {
    // Price validation (0-100 dollars = 0-10000 ticks)
    if (order.priceTicks < 1 || order.priceTicks > 9900) {
      return { valid: false, error: 'Price must be between $0.01 and $0.99' };
    }

    // Quantity validation
    if (order.qty <= 0) {
      return { valid: false, error: 'Quantity must be greater than 0' };
    }

    // Expiry validation (must be in future)
    if (order.expiry <= Date.now()) {
      return { valid: false, error: 'Expiry must be in the future' };
    }

    // Collateral validation
    const requiredCollateral = order.side === 'BUY' 
      ? Math.ceil((order.priceTicks * order.qty) / 100) 
      : order.qty;

    if (order.maxCollateral < requiredCollateral) {
      return { valid: false, error: 'Insufficient collateral specified' };
    }

    return { valid: true };
  }
}

export const eip712SigningService = new EIP712SigningService();
