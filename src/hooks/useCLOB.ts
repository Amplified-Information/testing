import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clobService } from '@/lib/clob';
import { useWallet } from '@/contexts/WalletContext';
import { CLOBOrder, OrderBook, CLOBPosition, CLOBTrade } from '@/types/clob';
import { useDebugger } from './useDebugger';
import { toast } from 'sonner';

export const useCLOBOrderBook = (marketId: string) => {
  const debug = useDebugger('useCLOBOrderBook');

  // Intelligent polling configuration
  const isDevelopment = import.meta.env.MODE === 'development';
  const isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;
  
  // Use faster polling for better real-time feel with new matching engine
  const getRefetchInterval = () => {
    if (!isDocumentVisible) return false; // Pause when tab not visible
    return isDevelopment ? 3000 : 1000; // 3s in dev, 1s in prod for real-time matching
  };

  return useQuery({
    queryKey: ['clob-orderbook', marketId],
    queryFn: async () => {
      // Reduced verbosity - only log in development
      if (isDevelopment) {
        debug.debug('Fetching CLOB order book', { marketId });
      }
      
      // Mock order book data for demonstration
      const mockOrderBook = {
        marketId,
        lastUpdate: Date.now(),
        bids: [
          { price: 6200, quantity: 1250, orderCount: 3 },
          { price: 6150, quantity: 2100, orderCount: 5 },
          { price: 6100, quantity: 850, orderCount: 2 },
          { price: 6050, quantity: 1800, orderCount: 4 },
          { price: 6000, quantity: 3200, orderCount: 8 },
          { price: 5950, quantity: 1100, orderCount: 2 },
          { price: 5900, quantity: 2500, orderCount: 6 },
          { price: 5850, quantity: 950, orderCount: 1 },
          { price: 5800, quantity: 1700, orderCount: 3 },
          { price: 5750, quantity: 2800, orderCount: 7 },
        ],
        asks: [
          { price: 6250, quantity: 900, orderCount: 2 },
          { price: 6300, quantity: 1600, orderCount: 4 },
          { price: 6350, quantity: 2200, orderCount: 6 },
          { price: 6400, quantity: 800, orderCount: 1 },
          { price: 6450, quantity: 1400, orderCount: 3 },
          { price: 6500, quantity: 3100, orderCount: 9 },
          { price: 6550, quantity: 1200, orderCount: 2 },
          { price: 6600, quantity: 1900, orderCount: 4 },
          { price: 6650, quantity: 2600, orderCount: 5 },
          { price: 6700, quantity: 1050, orderCount: 2 },
        ],
        snapshotRoot: "0x1234567890abcdef"
      };
      
      return mockOrderBook;
      // return clobService.getOrderBook(marketId);
    },
    enabled: !!marketId,
    refetchInterval: getRefetchInterval(),
    staleTime: 1000, // Reduced for real-time matching
  });
};

export const useCLOBPositions = (accountId?: string, marketId?: string) => {
  const { wallet } = useWallet();
  const effectiveAccountId = accountId || wallet.accountId;
  const debug = useDebugger('useCLOBPositions');

  return useQuery({
    queryKey: ['clob-positions', effectiveAccountId, marketId],
    queryFn: async () => {
      if (!effectiveAccountId) return [];
      debug.log('Fetching CLOB positions', { accountId: effectiveAccountId, marketId });
      return clobService.getPositions(effectiveAccountId, marketId);
    },
    enabled: !!effectiveAccountId,
    staleTime: 5000,
  });
};

export const useCLOBOrderHistory = (accountId?: string, marketId?: string, limit = 50) => {
  const { wallet } = useWallet();
  const effectiveAccountId = accountId || wallet.accountId;
  const debug = useDebugger('useCLOBOrderHistory');

  return useQuery({
    queryKey: ['clob-order-history', effectiveAccountId, marketId, limit],
    queryFn: async () => {
      if (!effectiveAccountId) return [];
      debug.log('Fetching CLOB order history', { accountId: effectiveAccountId, marketId, limit });
      return clobService.getOrderHistory(effectiveAccountId, marketId, limit);
    },
    enabled: !!effectiveAccountId,
    staleTime: 10000,
  });
};

export const useCLOBTradeHistory = (accountId?: string, marketId?: string, limit = 50) => {
  const { wallet } = useWallet();
  const effectiveAccountId = accountId || wallet.accountId;
  const debug = useDebugger('useCLOBTradeHistory');

  return useQuery({
    queryKey: ['clob-trade-history', effectiveAccountId, marketId, limit],
    queryFn: async () => {
      if (!effectiveAccountId) return [];
      debug.log('Fetching CLOB trade history', { accountId: effectiveAccountId, marketId, limit });
      return clobService.getTradeHistory(effectiveAccountId, marketId, limit);
    },
    enabled: !!effectiveAccountId,
    staleTime: 10000,
  });
};

export const useCLOBMarketStats = (marketId: string) => {
  const debug = useDebugger('useCLOBMarketStats');

  return useQuery({
    queryKey: ['clob-market-stats', marketId],
    queryFn: async () => {
      debug.log('Fetching CLOB market stats', { marketId });
      return clobService.getMarketStats(marketId);
    },
    enabled: !!marketId,
    staleTime: 30000, // Stats update less frequently
  });
};

export const useSubmitCLOBOrder = () => {
  const queryClient = useQueryClient();
  const debug = useDebugger('useSubmitCLOBOrder');

  return useMutation({
    mutationFn: async (order: CLOBOrder) => {
      debug.log('Submitting CLOB order', { orderId: order.orderId });
      return clobService.submitOrder(order);
    },
    onSuccess: (orderId, order) => {
      debug.log('CLOB order submitted successfully', { orderId });
      toast.success(`Order ${orderId.slice(0, 8)}... submitted successfully`);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clob-orderbook', order.marketId] });
      queryClient.invalidateQueries({ queryKey: ['clob-order-history'] });
      queryClient.invalidateQueries({ queryKey: ['clob-positions'] });
    },
    onError: (error) => {
      debug.error('Failed to submit CLOB order', error);
      toast.error('Failed to submit order: ' + error.message);
    },
  });
};

export const useCancelCLOBOrder = () => {
  const queryClient = useQueryClient();
  const { wallet } = useWallet();
  const debug = useDebugger('useCancelCLOBOrder');

  return useMutation({
    mutationFn: async ({ orderId, accountId }: { orderId: string; accountId?: string }) => {
      const effectiveAccountId = accountId || wallet.accountId;
      if (!effectiveAccountId) {
        throw new Error('No account ID available');
      }
      debug.log('Cancelling CLOB order', { orderId, accountId: effectiveAccountId });
      return clobService.cancelOrder(orderId, effectiveAccountId);
    },
    onSuccess: (_, variables) => {
      debug.log('CLOB order cancelled successfully', { orderId: variables.orderId });
      toast.success(`Order ${variables.orderId.slice(0, 8)}... cancelled successfully`);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clob-orderbook'] });
      queryClient.invalidateQueries({ queryKey: ['clob-order-history'] });
      queryClient.invalidateQueries({ queryKey: ['clob-positions'] });
    },
    onError: (error) => {
      debug.error('Failed to cancel CLOB order', error);
      toast.error('Failed to cancel order: ' + error.message);
    },
  });
};

// Utility hook to create orders with proper signing
export const useCLOBOrderBuilder = () => {
  const { wallet } = useWallet();
  const debug = useDebugger('useCLOBOrderBuilder');

  const buildOrder = async (params: {
    marketId: string;
    side: 'BUY' | 'SELL';
    priceTicks: number;
    qty: number;
    tif?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
    expiry?: number;
    maxCollateral: number;
  }): Promise<CLOBOrder> => {
    if (!wallet.accountId) {
      throw new Error('Wallet not connected');
    }

    const nonce = Date.now().toString();
    const timestamp = Date.now();

    const order: CLOBOrder = {
      domain: 'CLOB-v1',
      marketId: params.marketId,
      maker: wallet.accountId,
      side: params.side,
      priceTicks: params.priceTicks,
      qty: params.qty,
      tif: params.tif || 'GTC',
      expiry: params.expiry || (timestamp + 24 * 60 * 60 * 1000), // Default 24h expiry
      nonce,
      maxCollateral: params.maxCollateral,
      timestamp,
    };

    // Generate order ID from hash of order content
    const orderContent = JSON.stringify({
      domain: order.domain,
      marketId: order.marketId,
      maker: order.maker,
      side: order.side,
      priceTicks: order.priceTicks,
      qty: order.qty,
      nonce: order.nonce,
    });

    // Simple hash for orderId (in production, use proper keccak256)
    order.orderId = 'order_' + btoa(orderContent).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    
    // TODO: Implement proper EIP-712 signing with wallet
    // For now, create a mock signature
    order.signature = 'mock_signature_' + order.orderId;
    order.msgHash = 'mock_hash_' + order.orderId;

    debug.log('Built CLOB order', { orderId: order.orderId, marketId: params.marketId });
    return order;
  };

  return { buildOrder };
};