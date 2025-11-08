use tokio::sync::RwLock;
use std::sync::Arc;
use log;

pub mod proto {
    tonic::include_proto!("clob");
}
use proto::{OrderRequest, BookSnapshot, OrderDetail};

#[derive(Debug, Clone)]
pub struct OrderBookService {
    order_book: Arc<RwLock<OrderBook>>,
}

impl OrderBookService {
    pub fn new() -> Self {
        Self {
            order_book: Arc::new(RwLock::new(OrderBook::new(true))), // Default to allowing partial matching
        }
    }

    pub async fn place_order(&self, order: OrderRequest) {
        let mut book = self.order_book.write().await;
        book.add_order(order);
    }

    pub async fn get_book(&self) -> BookSnapshot {
        let book = self.order_book.read().await;
        book.snapshot()
    }
}

#[derive(Debug)]
pub struct OrderBook {
    buy_orders: Vec<OrderRequest>,
    sell_orders: Vec<OrderRequest>,
    allow_partial_matching: bool, // New field to enable/disable partial matching
}

impl OrderBook {
    pub fn new(allow_partial_matching: bool) -> Self {
        Self {
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
            allow_partial_matching,
        }
    }

    pub fn add_order(&mut self, order: OrderRequest) {
        log::info!("CREATE \t OrderRequest: {:?}", order); // Log the incoming order

        if order.price_usd < 0.0 {
            let mut adjusted_order = order.clone();
            adjusted_order.price_usd = order.price_usd.abs();
            Self::match_order(adjusted_order, &mut self.buy_orders, &mut self.sell_orders, self.allow_partial_matching);
        } else {
            Self::match_order(order, &mut self.sell_orders, &mut self.buy_orders, self.allow_partial_matching);
        }
    }

    fn match_order(mut incoming_order: OrderRequest, opposite_orders: &mut Vec<OrderRequest>, same_side_orders: &mut Vec<OrderRequest>, allow_partial_matching: bool) {
        // Sort opposite orders: ascending for sell orders, descending for buy orders
        if incoming_order.price_usd > 0.0 {
            opposite_orders.sort_by(|a, b| a.price_usd.partial_cmp(&b.price_usd).unwrap());
        } else {
            opposite_orders.sort_by(|a, b| b.price_usd.partial_cmp(&a.price_usd).unwrap());
        }

        let i = 0;
        while i < opposite_orders.len() {
            let existing_order = &mut opposite_orders[i];

            if allow_partial_matching {
                // Match based on price
                if (incoming_order.price_usd >= existing_order.price_usd && incoming_order.price_usd > 0.0) ||
                   (incoming_order.price_usd <= existing_order.price_usd && incoming_order.price_usd < 0.0) {

                    if incoming_order.qty <= existing_order.qty {
                        existing_order.qty -= incoming_order.qty;
                        if existing_order.qty == 0.0 {
                            opposite_orders.remove(i);
                        }
                        log::info!("MATCH \t OrderRequest: {:?}", incoming_order);
                        return;
                    } else {
                        incoming_order.qty -= existing_order.qty;
                        opposite_orders.remove(i);
                    }
                } else {
                    // No match possible due to price constraint
                    break;
                }
            } else {
                // Exact matching only
                if incoming_order.qty == existing_order.qty {
                    opposite_orders.remove(i);
                    log::info!("MATCH \t OrderRequest: {:?}", incoming_order);
                    return;
                } else {
                    // No match
                    break;
                }
            }
        }
        same_side_orders.push(incoming_order);
    }

    pub fn snapshot(&self) -> BookSnapshot {
        BookSnapshot {
            bids: self.buy_orders.iter().map(|order| OrderDetail {
                tx_id: order.tx_id.clone(),
                account_id: order.account_id.clone(),
                price_usd: order.price_usd,
                qty: order.qty,
            }).collect(),
            asks: self.sell_orders.iter().map(|order| OrderDetail {
                tx_id: order.tx_id.clone(),
                account_id: order.account_id.clone(),
                price_usd: order.price_usd,
                qty: order.qty,
            }).collect(),
        }
    }
}
