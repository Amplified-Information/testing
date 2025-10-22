import { supabase } from '@/integrations/supabase/client';
import { hcsService } from './hcs';
import { 
  CLOBOrder, 
  CLOBBatch, 
  CLOBTrade, 
  CLOBPosition, 
  OrderBook, 
  OrderBookLevel,
  CLOBOrderRow,
  CLOBBatchRow,
  CLOBTradeRow,
  CLOBPositionRow,
  SequencerState,
  HCSMessage
} from '@/types/clob';
import { keccak256 } from 'ethers';

export class CLOBService {
  private debugEnabled = import.meta.env.MODE === 'development';

  private log(message: string, data?: any) {
    if (this.debugEnabled) {
      console.log(`[CLOBService] ${message}`, data);
    }
  }

  private error(message: string, data?: any) {
    console.error(`[CLOBService] ${message}`, data);
  }

  /**
   * Submit a signed order to the CLOB (Off-chain, Polymarket-style)
   */
  async submitOrder(order: CLOBOrder): Promise<string> {
    try {
      this.log('Submitting CLOB order (Polymarket-style)', { 
        orderId: order.orderId, 
        marketId: order.marketId
      });

      // Validate order structure
      if (!order.orderId || !order.marketId || !order.maker) {
        throw new Error('Invalid order: missing required fields');
      }

      if (!order.signature || !order.msgHash) {
        throw new Error('Order must be signed before submission');
      }

      // Import services
      const { eip712SigningService } = await import('./eip712Signing');
      const { balanceChecker } = await import('./balanceChecker');

      // Validate signature
      const isValidSignature = eip712SigningService.verifySignature(
        order,
        order.signature,
        order.maker
      );

      if (!isValidSignature) {
        throw new Error('Invalid order signature');
      }

      // Check balance before accepting order
      console.log('💰 [CLOB] Checking balance for order...');
      const balanceCheck = await balanceChecker.validateOrderCollateral(
        order.maker,
        order.marketId,
        order.side,
        order.priceTicks,
        order.qty
      );

      if (!balanceCheck.hasBalance) {
        throw new Error(balanceCheck.error || 'Insufficient balance');
      }

      console.log('✅ [CLOB] Balance check passed', {
        available: balanceCheck.currentBalance.toFixed(2),
        required: balanceCheck.requiredBalance.toFixed(2)
      });

      // Direct database submission (Polymarket-style: off-chain only)
      console.log('💾 [CLOB] Submitting order to database queue...');
      
      const { data: queueData, error: queueError } = await supabase
        .from('order_queue')
        .insert({
          order_id: order.orderId,
          market_id: order.marketId,
          maker_account_id: order.maker,
          side: order.side,
          price_ticks: order.priceTicks,
          quantity: order.qty,
          max_collateral: order.maxCollateral,
          time_in_force: order.tif,
          expiry_timestamp: order.expiry,
          nonce: parseInt(order.nonce),
          order_signature: order.signature,
          msg_hash: order.msgHash,
          status: 'QUEUED'
        })
        .select()
        .single();

      if (queueError) {
        console.error('❌ [CLOB] Failed to insert order into queue', queueError);
        throw queueError;
      }

      console.log('✅ [CLOB] Order queued successfully', { 
        orderId: order.orderId, 
        queueId: queueData.id
      });

      // Trigger order matcher
      console.log('🎯 [CLOB] Triggering order matcher...');
      try {
        await supabase.functions.invoke('order-matcher', {
          body: { trigger: 'new_order', orderId: order.orderId }
        });
      } catch (matcherError) {
        console.warn('⚠️ [CLOB] Failed to trigger matcher, will be picked up by scheduled worker', matcherError);
      }

      return order.orderId;

    } catch (error) {
      this.error('Failed to submit CLOB order', error);
      throw error;
    }
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(marketId: string): Promise<OrderBook> {
    try {
      // First try to get real-time order book from sequencer state
      const { data: sequencerState } = await supabase
        .from('sequencer_state')
        .select('bid_levels, ask_levels, last_matched_price, total_volume_24h, last_processed_at')
        .eq('market_id', marketId)
        .single();
      
      if (sequencerState && sequencerState.bid_levels && sequencerState.ask_levels) {
        const bidLevels = sequencerState.bid_levels as any[]
        const askLevels = sequencerState.ask_levels as any[]
        
        return {
          marketId,
          bids: bidLevels.map((level: any) => ({
            price: level.price,
            quantity: level.quantity,
            orderCount: level.orders
          })),
          asks: askLevels.map((level: any) => ({
            price: level.price,
            quantity: level.quantity,
            orderCount: level.orders
          })),
          lastUpdate: new Date(sequencerState.last_processed_at).getTime()
        };
      }
      
      // Fallback to traditional method if sequencer state not available
      // Only log errors or when orders are found, not every fetch
      // this.log('Fetching order book via traditional method', { marketId });

      // Get active orders for the market
      const { data: ordersData, error } = await supabase
        .from('clob_orders')
        .select('*')
        .eq('market_id', marketId)
        .in('status', ['PUBLISHED', 'PARTIAL_FILL'])
        .order('price_ticks', { ascending: false });

      if (error) {
        this.error('Failed to fetch orders', error);
        throw error;
      }

      const orders = ordersData as CLOBOrderRow[];

      // Aggregate orders into order book levels
      const bids: OrderBookLevel[] = [];
      const asks: OrderBookLevel[] = [];

      const buyOrders = orders.filter(o => o.side === 'BUY');
      const sellOrders = orders.filter(o => o.side === 'SELL');

      // Group buy orders by price level
      const bidLevels = this.aggregateOrdersByPrice(buyOrders);
      bids.push(...bidLevels.sort((a, b) => b.price - a.price));

      // Group sell orders by price level
      const askLevels = this.aggregateOrdersByPrice(sellOrders);
      asks.push(...askLevels.sort((a, b) => a.price - b.price));

      return {
        marketId,
        bids,
        asks,
        lastUpdate: Date.now()
      };

    } catch (error) {
      this.error('Failed to get order book', error);
      throw error;
    }
  }

  /**
   * Get positions for an account
   */
  async getPositions(accountId: string, marketId?: string): Promise<CLOBPosition[]> {
    try {
      this.log('Fetching positions', { accountId, marketId });

      let query = supabase
        .from('clob_positions')
        .select('*')
        .eq('account_id', accountId);

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data: positions, error } = await query;

      if (error) {
        this.error('Failed to fetch positions', error);
        throw error;
      }

      return positions.map(this.mapPositionRowToPosition);

    } catch (error) {
      this.error('Failed to get positions', error);
      throw error;
    }
  }

  /**
   * Get order history for an account
   */
  async getOrderHistory(accountId: string, marketId?: string, limit = 100): Promise<CLOBOrder[]> {
    try {
      this.log('Fetching order history', { accountId, marketId, limit });

      let query = supabase
        .from('clob_orders')
        .select('*')
        .eq('maker_account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data: ordersData, error } = await query;

      if (error) {
        this.error('Failed to fetch order history', error);
        throw error;
      }

      const orders = ordersData as CLOBOrderRow[];
      return orders.map(this.mapOrderRowToOrder);

    } catch (error) {
      this.error('Failed to get order history', error);
      throw error;
    }
  }

  /**
   * Get trade history for an account
   */
  async getTradeHistory(accountId: string, marketId?: string, limit = 100): Promise<CLOBTrade[]> {
    try {
      this.log('Fetching trade history', { accountId, marketId, limit });

      let query = supabase
        .from('clob_trades')
        .select('*')
        .or(`buyer_account_id.eq.${accountId},seller_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data: trades, error } = await query;

      if (error) {
        this.error('Failed to fetch trade history', error);
        throw error;
      }

      return trades.map(this.mapTradeRowToTrade);

    } catch (error) {
      this.error('Failed to get trade history', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, accountId: string): Promise<void> {
    try {
      this.log('Cancelling order', { orderId, accountId });

      // Verify ownership and update status
      const { error } = await supabase
        .from('clob_orders')
        .update({ status: 'CANCELLED' })
        .eq('order_id', orderId)
        .eq('maker_account_id', accountId)
        .in('status', ['PENDING', 'PUBLISHED', 'PARTIAL_FILL']);

      if (error) {
        this.error('Failed to cancel order', error);
        throw error;
      }

      // Get HCS topic for orders to publish cancel message
      const { data: topic } = await supabase
        .from('hcs_topics')
        .select('topic_id')
        .eq('topic_type', 'orders')
        .in('market_id', [null]) // Global orders topic or market-specific
        .eq('is_active', true)
        .single();

      if (topic) {
        try {
          const cancelMessage = JSON.stringify({
            type: 'CANCEL_ORDER',
            orderId,
            accountId,
            timestamp: Date.now()
          });

          // TODO: Publish cancel message via HCS relayer or directly
          this.log('Would publish cancel message to HCS', { topicId: topic.topic_id, orderId });
        } catch (hcsError) {
          this.error('Failed to publish cancel message to HCS', hcsError);
          // Cancel still succeeded in database, so don't throw
        }
      }

      this.log('Order cancelled successfully', { orderId });

    } catch (error) {
      this.error('Failed to cancel order', error);
      throw error;
    }
  }

  /**
   * Get market statistics
   */
  async getMarketStats(marketId: string): Promise<any> {
    try {
      const { data: trades, error } = await supabase
        .from('clob_trades')
        .select('*')
        .eq('market_id', marketId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const volume24h = trades.reduce((sum, trade) => sum + trade.quantity, 0);
      const tradeCount24h = trades.length;

      return {
        volume24h,
        tradeCount24h,
        lastPrice: trades.length > 0 ? trades[trades.length - 1].price_ticks : 0
      };

    } catch (error) {
      this.error('Failed to get market stats', error);
      throw error;
    }
  }

  // Private helper methods

  private validateOrder(order: CLOBOrder): boolean {
    // Basic validation - in production, verify signature
    return !!(
      order.orderId &&
      order.marketId &&
      order.maker &&
      order.signature &&
      order.side &&
      typeof order.priceTicks === 'number' &&
      typeof order.qty === 'number' &&
      order.nonce
    );
  }

  private aggregateOrdersByPrice(orders: CLOBOrderRow[]): OrderBookLevel[] {
    const levels = new Map<number, { quantity: number; orderCount: number }>();

    for (const order of orders) {
      const remainingQty = order.quantity - order.filled_quantity;
      if (remainingQty <= 0) continue;

      const existing = levels.get(order.price_ticks) || { quantity: 0, orderCount: 0 };
      levels.set(order.price_ticks, {
        quantity: existing.quantity + remainingQty,
        orderCount: existing.orderCount + 1
      });
    }

    return Array.from(levels.entries()).map(([price, data]) => ({
      price,
      quantity: data.quantity,
      orderCount: data.orderCount
    }));
  }

  private mapOrderRowToOrder(row: CLOBOrderRow): CLOBOrder {
    return {
      domain: 'CLOB-v1',
      orderId: row.order_id,
      marketId: row.market_id,
      maker: row.maker_account_id,
      side: row.side,
      priceTicks: row.price_ticks,
      qty: row.quantity,
      tif: row.time_in_force,
      expiry: row.expiry_timestamp || 0,
      nonce: row.nonce.toString(),
      maxCollateral: row.max_collateral,
      timestamp: new Date(row.created_at).getTime(),
      signature: row.order_signature
    };
  }

  private mapTradeRowToTrade(row: CLOBTradeRow): CLOBTrade {
    return {
      tradeId: row.trade_id,
      buyOrderId: row.buy_order_id,
      sellOrderId: row.sell_order_id,
      priceTicks: row.price_ticks,
      qty: row.quantity,
      timestamp: row.trade_timestamp,
      buyerFee: row.buyer_fee,
      sellerFee: row.seller_fee,
      totalFee: row.total_fee,
    };
  }

  private mapPositionRowToPosition(row: CLOBPositionRow): CLOBPosition {
    return {
      marketId: row.market_id,
      accountId: row.account_id,
      positionType: row.position_type,
      quantity: row.quantity,
      avgEntryPrice: row.avg_entry_price,
      realizedPnl: row.realized_pnl,
      unrealizedPnl: row.unrealized_pnl,
      collateralLocked: row.collateral_locked
    };
  }
}

export const clobService = new CLOBService();