// CLOB Message Schemas and Types following EIP-712 style

export interface CLOBOrder {
  // Core order fields
  domain: string;
  marketId: string;
  maker: string; // Hedera account ID
  side: 'BUY' | 'SELL';
  priceTicks: number; // integer tick index (0..tickMax)
  qty: number; // base units (integer)
  tif: 'GTC' | 'IOC' | 'FOK' | 'GTD'; // time in force
  expiry: number; // unix timestamp
  nonce: string; // u64 as string
  maxCollateral: number; // smallest collateral units
  timestamp: number; // local client timestamp
  
  // Computed fields
  orderId?: string; // H(hash(orderJSON))
  signature?: string; // Ed25519 or ECDSA signature
  msgHash?: string; // keccak256/sha256 hash
}

export interface CLOBCancelOrder {
  type: 'CANCEL';
  orderId: string;
  maker: string; // Hedera account ID
  nonce: string;
  signature: string;
}

export interface CLOBReplaceOrder {
  type: 'REPLACE';
  orderId: string;
  newPriceTicks: number;
  newQty: number;
  signature: string;
}

export interface CLOBTrade {
  buyOrderId: string;
  sellOrderId: string;
  priceTicks: number;
  qty: number;
  tradeId?: string;
  timestamp?: number;
}

export interface CLOBBatch {
  batchId: string; // u64 as string
  marketId: string;
  windowStart: number; // unix timestamp
  windowEnd: number; // unix timestamp
  inputOrderRoot: string; // merkle root
  trades: CLOBTrade[];
  cancels: string[]; // array of order IDs
  bookSnapshotRoot: string; // merkle root
  sequencerSignature: string; // threshold sig or multisig
}

export interface CLOBPosition {
  marketId: string;
  accountId: string;
  positionType: 'YES' | 'NO';
  quantity: number;
  avgEntryPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  collateralLocked: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  marketId: string;
  bids: OrderBookLevel[]; // sorted by price descending
  asks: OrderBookLevel[]; // sorted by price ascending
  lastUpdate: number; // timestamp
  snapshotRoot?: string; // merkle root for verification
}

export interface HCSMessage {
  topicId: string;
  sequenceNumber: number;
  runningHash: string;
  consensusTimestamp: string;
  message: string; // base64 encoded message content
  chunks?: string[]; // for large messages split into chunks
}

export interface HCSTopic {
  topicId: string;
  topicType: 'orders' | 'batches' | 'oracle' | 'disputes';
  marketId?: string;
  description?: string;
  isActive: boolean;
}

export interface SequencerState {
  marketId: string;
  lastProcessedSequence: number;
  lastBatchId: number;
  orderBookSnapshot: OrderBook;
  lastProcessedAt: number;
}

export interface SettlementTransaction {
  batchId: string;
  transactionId: string;
  transactionHash?: string;
  gasUsed?: number;
  gasPrice?: number;
  transactionFee?: number;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
  errorMessage?: string;
}

// Database row types (matching the Supabase schema)
export interface CLOBOrderRow {
  id: string;
  order_id: string;
  market_id: string;
  maker_account_id: string;
  side: 'BUY' | 'SELL';
  price_ticks: number;
  quantity: number;
  filled_quantity: number;
  time_in_force: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  expiry_timestamp?: number;
  nonce: number;
  max_collateral: number;
  order_signature: string;
  hcs_message_id?: string;
  hcs_sequence_number?: number;
  status: 'PENDING' | 'PUBLISHED' | 'PARTIAL_FILL' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface CLOBBatchRow {
  id: string;
  batch_id: number;
  market_id: string;
  window_start: number;
  window_end: number;
  input_order_root: string;
  book_snapshot_root: string;
  trades_count: number;
  cancels_count: number;
  sequencer_signature: string;
  hcs_batch_message_id?: string;
  settlement_tx_hash?: string;
  settlement_status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'DISPUTED';
  created_at: string;
  updated_at: string;
}

export interface CLOBTradeRow {
  id: string;
  trade_id: string;
  batch_id: string;
  market_id: string;
  buy_order_id: string;
  sell_order_id: string;
  price_ticks: number;
  quantity: number;
  buyer_account_id: string;
  seller_account_id: string;
  trade_timestamp: number;
  created_at: string;
}

export interface CLOBPositionRow {
  id: string;
  market_id: string;
  account_id: string;
  position_type: 'YES' | 'NO';
  quantity: number;
  avg_entry_price: number;
  realized_pnl: number;
  unrealized_pnl: number;
  collateral_locked: number;
  created_at: string;
  updated_at: string;
}

// Market maker and trading utilities
export interface MarketMakerConfig {
  marketId: string;
  accountId: string;
  spreadBps: number; // spread in basis points
  maxPositionSize: number;
  inventoryTarget: number; // target inventory level (-1 to 1)
  minOrderSize: number;
  maxOrderSize: number;
  enabled: boolean;
}

export interface TradingStrategy {
  strategyId: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

// Error types
export interface CLOBError {
  code: string;
  message: string;
  details?: any;
}

export type CLOBOrderStatus = 'PENDING' | 'PUBLISHED' | 'PARTIAL_FILL' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
export type CLOBBatchStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'DISPUTED';
export type SettlementStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';