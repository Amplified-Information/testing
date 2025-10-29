use std::collections::{BTreeMap, VecDeque};
use std::cmp::Ordering;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use ordered_float::OrderedFloat;

pub type Price = OrderedFloat<f64>;
pub type Quantity = OrderedFloat<f64>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderRequest {
    pub owner: String,
    pub buy_sell: String,
    pub price: Price,
    pub amount: Quantity,
    #[serde(with = "chrono::serde::ts_nanoseconds")]
    pub timestamp_ns: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub owner: String,
    pub buy_sell: String,
    pub price: Price,
    pub amount: Quantity,
    pub timestamp_ns: DateTime<Utc>,
    pub tx_hash: Option<String>,
}

impl PartialEq for Order {
    fn eq(&self, other: &Self) -> bool {
        self.price == other.price && self.timestamp_ns == other.timestamp_ns && self.tx_hash == other.tx_hash
    }
}

impl Eq for Order {}

impl PartialOrd for Order {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Order {
    fn cmp(&self, other: &Self) -> Ordering {
        let price_cmp = self.price.cmp(&other.price);
        if price_cmp != Ordering::Equal {
            return price_cmp;
        }
        let ts_cmp = self.timestamp_ns.cmp(&other.timestamp_ns);
        if ts_cmp != Ordering::Equal {
            return ts_cmp;
        }
        self.tx_hash.cmp(&other.tx_hash)
    }
}

#[derive(Debug, Default)]
pub struct PriceLevel {
    pub queue: VecDeque<Order>,
}

impl PriceLevel {
    pub fn push(&mut self, o: Order) {
        self.queue.push_back(o);
    }
    pub fn push_front(&mut self, o: Order) {
        self.queue.push_front(o)
    }
    pub fn front_mut(&mut self) -> Option<&mut Order> { self.queue.front_mut() }
    pub fn pop_front(&mut self) -> Option<Order> { self.queue.pop_front() }
    pub fn is_empty(&self) -> bool { self.queue.is_empty() }
}

#[derive(Default)]
pub struct OrderBook {
    pub bids: BTreeMap<Price, PriceLevel>,
    pub asks: BTreeMap<Price, PriceLevel>,
}

impl OrderBook {
    pub fn new() -> Self { Self::default() }

    pub fn insert_order(&mut self, order: Order) {
        if order.buy_sell == "sell" {
            self.bids.entry(order.price).or_default().push(order);
        } else if order.buy_sell == "buy" {
            self.asks.entry(order.price).or_default().push(order);
        } else {
            tracing::error!("Invalid buy_sell value: {}", order.buy_sell);
        }
    }

    pub fn best_bid_mut(&mut self) -> Option<(Price, &mut Order)> {
        self.bids.iter_mut().rev().find_map(|(p, lvl)| lvl.front_mut().map(|o| (*p, o)))
    }

    pub fn best_ask_mut(&mut self) -> Option<(Price, &mut Order)> {
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

#[derive(Clone)]
pub struct Engine {
    pub book: Arc<Mutex<OrderBook>>,
}

#[derive(Debug, Serialize)]
pub struct Trade {
    pub buyer: String,
    pub seller: String,
    pub price: Price,
    pub amount: Quantity,
    pub timestamp: DateTime<Utc>,
}
