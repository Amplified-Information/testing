use std::collections::{BTreeMap, VecDeque};
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Serialize};
use chrono::{DateTime, Utc};
use ordered_float::OrderedFloat;

pub type Price = OrderedFloat<f64>;
pub type Quantity = OrderedFloat<f64>;

pub mod clob_proto {
    tonic::include_proto!("clob");
}
use clob_proto::*;

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct OrderRequest {
//     pub tx_id: String,
//     pub account_id: String,
//     pub price_usd: Price,
//     pub n_shares: Quantity,
// }

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct Order {
//     pub tx_id: String,
//     pub account_id: String,
//     pub price_usd: Price,
//     pub n_shares: Quantity,
// }

#[derive(Debug, Serialize)]
pub struct Trade {
    pub buyer: String,
    pub seller: String,
    pub price: Price,
    pub amount: Quantity,
    pub timestamp: DateTime<Utc>,
}

#[derive(Clone)]
pub struct Engine {
    pub book: Arc<Mutex<OrderBook>>,
}

#[derive(Debug, Default)]
pub struct PriceLevel {
    pub queue: VecDeque<OrderRequest>,
}

#[derive(Default)]
pub struct OrderBook {
    pub bids: BTreeMap<Price, PriceLevel>,
    pub asks: BTreeMap<Price, PriceLevel>,
}

impl PriceLevel {
    pub fn push(&mut self, o: OrderRequest) {
        self.queue.push_back(o);
    }
    pub fn push_front(&mut self, o: OrderRequest) {
        self.queue.push_front(o)
    }
    pub fn front_mut(&mut self) -> Option<&mut OrderRequest> { self.queue.front_mut() }
    pub fn pop_front(&mut self) -> Option<OrderRequest> { self.queue.pop_front() }
    pub fn is_empty(&self) -> bool { self.queue.is_empty() }
}

impl OrderBook {
    pub fn new() -> Self { Self::default() }

    pub fn insert_order(&mut self, order: OrderRequest) {
        if order.price_usd > 0.0 {
            // Positive prices are buy orders (bids)
            self.bids.entry(ordered_float::OrderedFloat(order.price_usd)).or_default().push(order);
        } else if order.price_usd < 0.0 {
            // Negative prices are sell orders (asks)
            self.asks.entry(ordered_float::OrderedFloat(order.price_usd)).or_default().push(order);
        } else {
            // Handle zero prices - could be market orders or invalid orders
            tracing::warn!("Order with zero price_usd received: {:?}", order);
            tracing::warn!("Rejecting order with price_usd: {} (tx_id: {})", order.price_usd, order.tx_id);
        }
    }

    pub fn best_bid_mut(&mut self) -> Option<(Price, &mut OrderRequest)> {
        self.bids.iter_mut().rev().find_map(|(p, lvl)| lvl.front_mut().map(|o| (*p, o)))
    }

    pub fn best_ask_mut(&mut self) -> Option<(Price, &mut OrderRequest)> {
        self.asks.iter_mut().find_map(|(p, lvl)| lvl.front_mut().map(|o| (*p, o)))
    }

    pub fn cleanup_empty_levels(&mut self) {
        let empty_bids: Vec<_> = self.bids.iter().filter(|(_, lvl)| lvl.is_empty()).map(|(k, _)| *k).collect();
        for k in empty_bids { self.bids.remove(&k); }
        let empty_asks: Vec<_> = self.asks.iter().filter(|(_, lvl)| lvl.is_empty()).map(|(k, _)| *k).collect();
        for k in empty_asks { self.asks.remove(&k); }
    }

    pub fn snapshot_top(&self, depth: usize) -> (Vec<(Price, usize)>, Vec<(Price, usize)>) {
        let bids = self.bids.iter().rev().take(depth).map(|(p, lvl)| (*p, lvl.queue.len())).collect();
        let asks = self.asks.iter().take(depth).map(|(p, lvl)| (*p, lvl.queue.len())).collect();
        (bids, asks)
    }
}
