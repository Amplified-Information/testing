use tokio::sync::RwLock;
use std::sync::Arc;

pub mod proto {
    tonic::include_proto!("clob");
}
use proto::{OrderRequest, BookSnapshot};

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
pub struct OrderBook;

impl OrderBook {
    pub fn new() -> Self {
        Self
    }

    pub fn add_order(&mut self, _order: OrderRequest) {
        // Add order logic
    }

    pub fn snapshot(&self) -> BookSnapshot {
        BookSnapshot {
            bids: vec![],
            asks: vec![],
        }
    }
}