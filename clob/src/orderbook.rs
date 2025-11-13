use tokio::sync::RwLock;
use std::{sync::Arc};
use log;

pub mod proto {
    tonic::include_proto!("clob");
}
use proto::{OrderRequestClob, BookSnapshot, OrderDetail};

use crate::{nats};

#[derive(Debug, Clone)]
pub struct OrderBookService {
    order_book: Arc<RwLock<OrderBook>>
}

impl OrderBookService {
    pub fn new(nats_service: &nats::NatsService) -> Self {
        Self {
            order_book: Arc::new(RwLock::new(OrderBook::new(&nats_service.clone())))
        }
    }

    pub async fn place_order(&self, order: OrderRequestClob) -> Result<(), Box<dyn std::error::Error>> {
        let mut book = self.order_book.write().await;
        book.add_order(order.clone()).await;
        Ok(())
    }

    pub async fn get_book(&self, depth: usize) -> BookSnapshot {
        let book = self.order_book.read().await;
        book.snapshot(depth)
    }

    pub fn start_periodic_scan(&self, duration_seconds: u64) -> impl Future<Output = Result<(), Box<dyn std::error::Error>>> {
        let order_book = Arc::clone(&self.order_book);
        async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(duration_seconds));
            loop {
                interval.tick().await;
                let mut book = order_book.write().await;
                book.scan_for_matches().await;
            }
        }
    }
}

#[derive(Debug)]
pub struct OrderBook {
    buy_orders: Vec<OrderRequestClob>,
    sell_orders: Vec<OrderRequestClob>,
    nats_service: Arc<nats::NatsService> // wrap in arc to make cloning cheap
}

impl OrderBook {
    pub fn new(nats_service: &nats::NatsService) -> Self {
        Self {
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
            nats_service: Arc::new(nats_service.clone()),
        }
    }

    pub async fn add_order(&mut self, order: OrderRequestClob) {
        log::info!("CREATE \t OrderRequestClob: {:?}", order); // Log the incoming order

        if order.price_usd < 0.0 {
            Self::match_order(&self.nats_service, order, &mut self.buy_orders, &mut self.sell_orders).await;
        } else {
            Self::match_order(&self.nats_service, order, &mut self.sell_orders, &mut self.buy_orders).await;
        }
    }

    async fn match_order(nats_service: &nats::NatsService, mut incoming_order: OrderRequestClob, opposite_orders: &mut Vec<OrderRequestClob>, same_side_orders: &mut Vec<OrderRequestClob>) {
        opposite_orders.sort_by(|a, b| b.price_usd.partial_cmp(&a.price_usd).unwrap());

        let i = 0;
        while i < opposite_orders.len() {
            let existing_order = &mut opposite_orders[i];
            // Match based on price constraints
            if (incoming_order.price_usd > 0.0 && incoming_order.price_usd >= existing_order.price_usd) ||
               (incoming_order.price_usd < 0.0 && existing_order.price_usd >= incoming_order.price_usd.abs()) {

                let orc2= existing_order.clone();
                if incoming_order.qty <= existing_order.qty {
                    existing_order.qty -= incoming_order.qty;
                    if existing_order.qty == 0.0 {
                        opposite_orders.remove(i);
                    }

                    log::info!("MATCH \t OrderRequestClob: {:?}", incoming_order);
                    

                    // Notify NATS of full match - spawn to fire/forget
                    let orc1 = incoming_order.clone();
                    let nats_clone = nats_service.clone();
                    tokio::spawn(async move {
                        if let Err(e) = nats_clone.publish_match(false, &orc1, &orc2).await {
                            log::error!("NATS\tFailed to publish match: {}", e);
                        }
                    });
                    
                    return;
                } else {
                    incoming_order.qty -= existing_order.qty;
                    opposite_orders.remove(i);

                    log::info!("MATCH_PARTIAL \t Remaining incoming order quantity: {}", incoming_order.qty);
                    
                     // Notify NATS of partial match - spawn to fire/forget
                    let orc1 = incoming_order.clone();
                    let nats_clone = nats_service.clone();
                    tokio::spawn(async move {
                        if let Err(e) = nats_clone.publish_match(true, &orc1, &orc2).await {
                            log::error!("NATS\tFailed to publish match: {}", e);
                        }
                    });
                    continue; // Continue searching for additional matches (partial match)
                }
            } else {
                // No match possible due to price constraint
                break;
            }
        }

        // If no match, add to the respective order book // log::info!("No match found, adding to same side orders: {:?}", incoming_order);
        same_side_orders.push(incoming_order);
    }

    pub fn snapshot(&self, depth: usize) -> BookSnapshot {
        let effective_depth = if depth == 0 { usize::MAX } else { depth }; // depth = 0 -> return everything

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
            }).take(effective_depth).collect(),
        }
    }

    // Scan to find matches in the order book
    // This function runs periodically
    pub async fn scan_for_matches(&mut self) {
        log::info!("SCAN \t Scanning orderbook for matches...");

        // Sort buy orders by price descending (highest first)
        self.buy_orders.sort_by(|a, b| b.price_usd.partial_cmp(&a.price_usd).unwrap());
        // Sort sell orders by price ascending (lowest first)
        self.sell_orders.sort_by(|a, b| a.price_usd.partial_cmp(&b.price_usd).unwrap());

        // Attempt to match all sell orders with buy orders
        let mut i = 0;
        while i < self.sell_orders.len() {
            let sell_order = self.sell_orders[i].clone();

            // Check if the sell order can be matched with the highest buy order
            if let Some(highest_buy_order) = self.buy_orders.first() {
                if sell_order.price_usd.abs() <= highest_buy_order.price_usd {
                    self.sell_orders.remove(i);
                    Self::match_order(&self.nats_service, sell_order, &mut self.buy_orders, &mut self.sell_orders).await;
                    continue; // Recheck the current index after removal
                }
            }

            i += 1; // Move to the next sell order if no match
        }

        // Attempt to match all buy orders with sell orders
        let mut i = 0;
        while i < self.buy_orders.len() {
            let buy_order = self.buy_orders[i].clone();

            // Check if the buy order can be matched with the lowest sell order
            if let Some(lowest_sell_order) = self.sell_orders.first() {
                if buy_order.price_usd >= lowest_sell_order.price_usd.abs() {
                    self.buy_orders.remove(i);
                    Self::match_order(&self.nats_service, buy_order, &mut self.sell_orders, &mut self.buy_orders).await;
                    continue; // Recheck the current index after removal
                }
            }

            i += 1; // Move to the next buy order if no match
        }

        log::info!("SCAN \t Complete.");
    }
}
