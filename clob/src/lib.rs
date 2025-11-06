mod types;
pub mod nats;
pub use types::*;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::Utc;
use ordered_float::OrderedFloat;

use crate::types::clob_proto::OrderRequest;

impl Engine {
	pub fn new() -> Self {
		Self { book: Arc::new(Mutex::new(OrderBook::new())) }
	}

	pub async fn try_match(&self, maybe_new_order: Option<OrderRequest>) -> Vec<Trade> {
    let mut trades: Vec<Trade> = Vec::new();

    // Insert new order if present
    if let Some(o) = maybe_new_order {
        let mut book = self.book.lock().await;
        book.insert_order(o);
    }

    loop {
        // Lock book
        let mut book = self.book.lock().await;

        // Step 1: Find best bid and ask prices
        let best_bid_price = match book.bids.keys().rev().find(|&p| !book.bids[p].queue.is_empty()) {
            Some(&p) => p,
            None => break,
        };
        // For asks (negative prices), we want the highest negative number (closest to zero = lowest ask price)
        let best_ask_price = match book.asks.keys().rev().find(|&p| !book.asks[p].queue.is_empty()) {
            Some(&p) => p,
            None => break,
        };

        // With signed prices: bids are positive (willing to pay), asks are negative (willing to receive)
        // Match when bid price >= |ask price| (absolute value of negative ask price)
        if best_bid_price < OrderedFloat(best_ask_price.abs()) {
            break;
        }

        // Step 2: Safely remove the front orders from their price levels
        let mut bid_level = book.bids.remove(&best_bid_price).unwrap();
        let mut ask_level = book.asks.remove(&best_ask_price).unwrap();

        let mut bid_order = bid_level.pop_front().unwrap();
        let mut ask_order = ask_level.pop_front().unwrap();

        // Step 3: Determine trade
        let trade_amount = bid_order.n_shares.min(ask_order.n_shares);
        let trade_price = best_ask_price;

        let trade = Trade {
            buyer: bid_order.account_id.clone(),
            seller: ask_order.account_id.clone(),
            price: trade_price,
            amount: ordered_float::OrderedFloat(trade_amount),
            timestamp: Utc::now(),
        };

        // Step 4: Reduce quantities
        bid_order.n_shares -= trade_amount;
        ask_order.n_shares -= trade_amount;

        // Step 5: Put orders back if partially filled
        if bid_order.n_shares > *OrderedFloat(0.0) {
            bid_level.push_front(bid_order);
        }
        if ask_order.n_shares > *OrderedFloat(0.0) {
            ask_level.push_front(ask_order);
        }

        // Step 6: Re-insert price levels if not empty
        if !bid_level.is_empty() {
            book.bids.insert(best_bid_price, bid_level);
        }
        if !ask_level.is_empty() {
            book.asks.insert(best_ask_price, ask_level);
        }

        drop(book); // Release lock before async settlement

        self.settle_trade(&trade).await.expect("settlement failed");
        trades.push(trade);
    }

    trades
	}


	async fn settle_trade(&self, trade: &Trade) -> Result<(), String> {
		tracing::info!("{} <{}> {:?}", Utc::now(), "SETTLE_TRADE", trade);
		Ok(())
	}

	pub async fn snapshot_top(&self, depth: usize) -> (Vec<(Price, usize)>, Vec<(Price, usize)>) {
		let book = self.book.lock().await;
		book.snapshot_top(depth)
	}

	// pub fn create_order_from_request(&self, req: OrderRequest) -> Order {
	// 	Order {
	// 		tx_id: req.tx_id,
	// 		account_id: req.account_id,
	// 		price_usd: req.price_usd,
	// 		n_shares: req.n_shares,
	// 	}
	// }
}
