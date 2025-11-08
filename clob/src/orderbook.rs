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
            order_book: Arc::new(RwLock::new(OrderBook::new())),
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

    pub async fn process_nats_order(&self, order: OrderRequest) {
        self.place_order(order).await;
    }
}

#[derive(Debug)]
pub struct OrderBook {
    buy_orders: Vec<OrderRequest>,
    sell_orders: Vec<OrderRequest>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            buy_orders: Vec::new(),
            sell_orders: Vec::new(),
        }
    }

    pub fn add_order(&mut self, order: OrderRequest) {
      log::info!("OrderRequest received: {:?}", order);
      if order.price_usd > 0.0 {
        let mut sell_orders = std::mem::take(&mut self.sell_orders);
        self.match_order(order, &mut sell_orders);
        self.sell_orders = sell_orders;
      } else if order.price_usd < 0.0 {
        let mut buy_orders = std::mem::take(&mut self.buy_orders);
        self.match_order(order, &mut buy_orders);
        self.buy_orders = buy_orders;
      } else {
        log::warn!("Invalid order: {:?}", order);
      }
    }

    fn match_order(&mut self, mut incoming_order: OrderRequest, opposite_orders: &mut Vec<OrderRequest>) {
        opposite_orders.sort_by(|a, b| a.price_usd.partial_cmp(&b.price_usd).unwrap());

        let i = 0;
        while i < opposite_orders.len() {
            let existing_order = &mut opposite_orders[i];

            if incoming_order.qty <= existing_order.qty {
                existing_order.qty -= incoming_order.qty;
                if existing_order.qty == 0.0 {
                    opposite_orders.remove(i);
                }
                log::info!("Order matched: {:?}", incoming_order);
                return;
            } else {
                incoming_order.qty -= existing_order.qty;
                opposite_orders.remove(i);
            }
        }

        // If no match, add to the respective order book
        if incoming_order.price_usd > 0.0 {
            self.buy_orders.push(incoming_order);
        } else {
            self.sell_orders.push(incoming_order);
        }
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