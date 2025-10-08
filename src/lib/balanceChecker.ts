import { supabase } from '@/integrations/supabase/client';

/**
 * Balance Checker Service
 * Validates user has sufficient USDC balance before accepting orders
 */

export interface BalanceCheckResult {
  hasBalance: boolean;
  currentBalance: number;
  requiredBalance: number;
  error?: string;
}

class BalanceCheckerService {
  /**
   * Check if user has sufficient USDC balance for order
   * Uses Hedera Mirror Node API to check HTS token balance
   */
  async checkUsdcBalance(
    accountId: string,
    requiredAmount: number
  ): Promise<BalanceCheckResult> {
    try {
      // Query Hedera Mirror Node for account balance
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
      
      const response = await fetch(mirrorNodeUrl);
      if (!response.ok) {
        return {
          hasBalance: false,
          currentBalance: 0,
          requiredBalance: requiredAmount,
          error: 'Failed to fetch account balance',
        };
      }

      const data = await response.json();
      
      // TODO: Replace with actual USDC token ID for Hedera testnet
      // For now, use HBAR balance as proxy (should be HTS token balance)
      const balanceInTinybars = parseInt(data.balance?.balance || '0');
      const balanceInUsdc = balanceInTinybars / 100_000_000; // Convert to USDC (6 decimals for USDC)

      return {
        hasBalance: balanceInUsdc >= requiredAmount,
        currentBalance: balanceInUsdc,
        requiredBalance: requiredAmount,
      };
    } catch (error) {
      console.error('Balance check failed:', error);
      return {
        hasBalance: false,
        currentBalance: 0,
        requiredBalance: requiredAmount,
        error: 'Balance check failed: ' + (error as Error).message,
      };
    }
  }

  /**
   * Check if user has sufficient collateral locked in positions
   */
  async checkLockedCollateral(
    accountId: string,
    marketId: string
  ): Promise<number> {
    try {
      const { data: positions, error } = await supabase
        .from('clob_positions')
        .select('collateral_locked')
        .eq('account_id', accountId)
        .eq('market_id', marketId);

      if (error) throw error;

      const totalLocked = positions?.reduce(
        (sum, pos) => sum + Number(pos.collateral_locked),
        0
      ) || 0;

      return totalLocked;
    } catch (error) {
      console.error('Failed to check locked collateral:', error);
      return 0;
    }
  }

  /**
   * Calculate required collateral for order in USDC
   */
  calculateRequiredCollateral(
    side: 'BUY' | 'SELL',
    priceTicks: number,
    quantity: number
  ): number {
    if (side === 'BUY') {
      // Buyer locks: price * quantity / 100 (convert ticks to USDC)
      return (priceTicks * quantity) / 100;
    } else {
      // Seller locks: (1 - price) * quantity (max loss if price goes to $1)
      return ((100 - priceTicks) * quantity) / 100;
    }
  }

  /**
   * Comprehensive balance check before order submission
   */
  async validateOrderCollateral(
    accountId: string,
    marketId: string,
    side: 'BUY' | 'SELL',
    priceTicks: number,
    quantity: number
  ): Promise<BalanceCheckResult> {
    const requiredCollateral = this.calculateRequiredCollateral(side, priceTicks, quantity);
    
    // Check available balance
    const balanceCheck = await this.checkUsdcBalance(accountId, requiredCollateral);
    
    if (!balanceCheck.hasBalance) {
      return balanceCheck;
    }

    // Check locked collateral
    const lockedCollateral = await this.checkLockedCollateral(accountId, marketId);
    const availableBalance = balanceCheck.currentBalance - lockedCollateral;

    return {
      hasBalance: availableBalance >= requiredCollateral,
      currentBalance: availableBalance,
      requiredBalance: requiredCollateral,
      error: availableBalance < requiredCollateral 
        ? `Insufficient available balance. You have ${availableBalance.toFixed(2)} USDC available (${lockedCollateral.toFixed(2)} USDC locked in positions), but need ${requiredCollateral.toFixed(2)} USDC`
        : undefined,
    };
  }
}

export const balanceChecker = new BalanceCheckerService();
