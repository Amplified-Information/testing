use tokio::sync::RwLock;
use std::{sync::Arc};
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

    pub async fn get_book(&self, depth: usize) -> BookSnapshot {
        let book = self.order_book.read().await;
        book.snapshot(depth)
    }

    pub async fn start_periodic_scan(&self) {
        let order_book = Arc::clone(&self.order_book);
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));
            loop {
                interval.tick().await;
                let mut book = order_book.write().await;
                book.scan_for_matches();
            }
        });
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

    pub fn snapshot(&self, depth: usize) -> BookSnapshot {
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
            }).take(depth).collect(),
        }
    }

    // Scan to find matches in the order book
    // This function runs periodically
    pub fn scan_for_matches(&mut self) {
        // Sort buy orders by price descending (highest first)
        self.buy_orders.sort_by(|a, b| b.price_usd.partial_cmp(&a.price_usd).unwrap());
        // Sort sell orders by price ascending (lowest first)
        self.sell_orders.sort_by(|a, b| a.price_usd.partial_cmp(&b.price_usd).unwrap());

        let mut i = 0;
        while i < self.buy_orders.len() && !self.sell_orders.is_empty() {
            let buy_order = &self.buy_orders[i];
            let sell_order = &self.sell_orders[0];

            // Check if a match is possible
            if buy_order.price_usd >= sell_order.price_usd {
                let mut buy_order = self.buy_orders.remove(i);
                let mut sell_order = self.sell_orders.remove(0);

                if self.allow_partial_matching {
                    if buy_order.qty <= sell_order.qty {
                        sell_order.qty -= buy_order.qty;
                        log::info!("MATCH \t Buy Order: {:?} with Sell Order", buy_order);
                        if sell_order.qty > 0.0 {
                            self.sell_orders.insert(0, sell_order);
                        }
                    } else {
                        buy_order.qty -= sell_order.qty;
                        log::info!("MATCH \t Sell Order: {:?} with Buy Order", sell_order);
                        self.buy_orders.insert(i, buy_order);
                    }
                } else {
                    // Exact matching only
                    if buy_order.qty == sell_order.qty {
                        log::info!("MATCH \t Buy Order: {:?} with Sell Order: {:?}", buy_order, sell_order);
                    } else {
                        // No exact match, put them back
                        self.buy_orders.insert(i, buy_order);
                        self.sell_orders.insert(0, sell_order);
                        i += 1;
                    }
                }
            } else {
                // No more matches possible
                break;
            }
        }
    }
}
