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
import { useDebugger } from '@/hooks/useDebugger';
import { keccak256 } from 'ethers';

export class CLOBService {
  private debug = useDebugger('CLOBService');

  /**
   * Submit a signed order to the CLOB system
   */
  async submitOrder(order: CLOBOrder): Promise<string> {
    try {
      this.debug.log('Submitting CLOB order', { orderId: order.orderId, marketId: order.marketId });

      // Validate order signature and structure
      if (!this.validateOrder(order)) {
        throw new Error('Invalid order structure or signature');
      }

      // Store order in database
      const { data: orderRow, error: dbError } = await supabase
        .from('clob_orders')
        .insert({
          order_id: order.orderId!,
          market_id: order.marketId,
          maker_account_id: order.maker,
          side: order.side,
          price_ticks: order.priceTicks,
          quantity: order.qty,
          time_in_force: order.tif,
          expiry_timestamp: order.expiry,
          nonce: parseInt(order.nonce),
          max_collateral: order.maxCollateral,
          order_signature: order.signature!,
          status: 'PENDING'
        })
        .select()
        .single();

      if (dbError) {
        this.debug.error('Failed to store order in database', dbError);
        throw dbError;
      }

      // TODO: Publish to HCS orders topic (requires operator credentials)
      // For now, we'll mark the order as published
      await supabase
        .from('clob_orders')
        .update({ status: 'PUBLISHED' })
        .eq('id', orderRow.id);

      this.debug.log('Order submitted successfully', { orderId: order.orderId });
      return order.orderId!;

    } catch (error) {
      this.debug.error('Failed to submit CLOB order', error);
      throw error;
    }
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(marketId: string): Promise<OrderBook> {
    try {
      this.debug.log('Fetching order book', { marketId });

      // Get active orders for the market
      const { data: ordersData, error } = await supabase
        .from('clob_orders')
        .select('*')
        .eq('market_id', marketId)
        .in('status', ['PUBLISHED', 'PARTIAL_FILL'])
        .order('price_ticks', { ascending: false });

      if (error) {
        this.debug.error('Failed to fetch orders', error);
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
      this.debug.error('Failed to get order book', error);
      throw error;
    }
  }

  /**
   * Get positions for an account
   */
  async getPositions(accountId: string, marketId?: string): Promise<CLOBPosition[]> {
    try {
      this.debug.log('Fetching positions', { accountId, marketId });

      let query = supabase
        .from('clob_positions')
        .select('*')
        .eq('account_id', accountId);

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data: positions, error } = await query;

      if (error) {
        this.debug.error('Failed to fetch positions', error);
        throw error;
      }

      return positions.map(this.mapPositionRowToPosition);

    } catch (error) {
      this.debug.error('Failed to get positions', error);
      throw error;
    }
  }

  /**
   * Get order history for an account
   */
  async getOrderHistory(accountId: string, marketId?: string, limit = 100): Promise<CLOBOrder[]> {
    try {
      this.debug.log('Fetching order history', { accountId, marketId, limit });

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
        this.debug.error('Failed to fetch order history', error);
        throw error;
      }

      const orders = ordersData as CLOBOrderRow[];
      return orders.map(this.mapOrderRowToOrder);

    } catch (error) {
      this.debug.error('Failed to get order history', error);
      throw error;
    }
  }

  /**
   * Get trade history for an account
   */
  async getTradeHistory(accountId: string, marketId?: string, limit = 100): Promise<CLOBTrade[]> {
    try {
      this.debug.log('Fetching trade history', { accountId, marketId, limit });

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
        this.debug.error('Failed to fetch trade history', error);
        throw error;
      }

      return trades.map(this.mapTradeRowToTrade);

    } catch (error) {
      this.debug.error('Failed to get trade history', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, accountId: string): Promise<void> {
    try {
      this.debug.log('Cancelling order', { orderId, accountId });

      // Verify ownership and update status
      const { error } = await supabase
        .from('clob_orders')
        .update({ status: 'CANCELLED' })
        .eq('order_id', orderId)
        .eq('maker_account_id', accountId)
        .in('status', ['PENDING', 'PUBLISHED', 'PARTIAL_FILL']);

      if (error) {
        this.debug.error('Failed to cancel order', error);
        throw error;
      }

      // TODO: Publish cancel message to HCS topic

      this.debug.log('Order cancelled successfully', { orderId });

    } catch (error) {
      this.debug.error('Failed to cancel order', error);
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
      this.debug.error('Failed to get market stats', error);
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
      timestamp: row.trade_timestamp
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