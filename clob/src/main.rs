use std::sync::Arc;
use std::fs;
use toml::Value;
use tonic::{transport::Server, Request, Response, Status};

pub mod clob_proto {
    tonic::include_proto!("clob");
}

use clob_proto::clob_server::{Clob, ClobServer};
use clob_proto::*;
use clob::{Engine, OrderRequest as EngineOrderRequest};
use chrono::{DateTime, Utc};

use tokio::sync::broadcast;

use clob::nats::initialize_nats;

pub struct MyClobService {
    engine: Arc<Engine>,
    book_depth: usize,
    book_update_tx: broadcast::Sender<()>,
}

fn proto_to_engine_order_request(req: OrderRequest) -> Result<EngineOrderRequest, Status> {
    let ts = DateTime::<Utc>::from_timestamp(
        req.timestamp_ns / 1_000_000_000,
        (req.timestamp_ns % 1_000_000_000) as u32,
    ).ok_or(Status::invalid_argument("invalid timestamp"))?;
    Ok(EngineOrderRequest {
        owner: req.owner,
        buy_sell: req.buy_sell,
        price: req.price.into(),
        amount: req.amount.into(),
        timestamp_ns: ts,
        tx_hash: if req.tx_hash.is_empty() { None } else { Some(req.tx_hash) },
    })
}

use futures_core::Stream;
use std::pin::Pin;

#[tonic::async_trait]
impl Clob for MyClobService {
    type StreamBookStream = Pin<Box<dyn Stream<Item = Result<BookSnapshot, Status>> + Send + 'static>>;

    async fn place_order(&self, request: Request<OrderRequest>) -> Result<Response<OrderResponse>, Status> {
        let req = request.into_inner();
        let engine_req = proto_to_engine_order_request(req)?;
        let order = self.engine.create_order_from_request(engine_req);

        tracing::info!("{} <{}> {:?}", Utc::now(), "ORDER_CREATED", order);

        let trades = self.engine.try_match(Some(order)).await;
        let status = if trades.is_empty() { "accepted" } else { "matched" };

        // Notify all stream_book subscribers
        let _ = self.book_update_tx.send(());

        Ok(Response::new(OrderResponse {
            status: status.to_string(),
            error: "".to_string(),
        }))
    }

    async fn get_book(
        &self,
        request: Request<BookRequest>,
    ) -> Result<Response<BookSnapshot>, Status> {
        let depth = {
            let d = request.into_inner().depth as usize;
            if d == 0 { self.book_depth } else { d }
        };
        let (bids, asks) = self.engine.snapshot_top(depth).await;
        Ok(Response::new(BookSnapshot {
            bids: bids.into_iter().map(|(price, count)| PriceLevel { price: price.into_inner(), count: count as u32 }).collect(),
            asks: asks.into_iter().map(|(price, count)| PriceLevel { price: price.into_inner(), count: count as u32 }).collect(),
        }))
    }

    async fn stream_book(
        &self,
        request: Request<BookRequest>,
    ) -> Result<Response<Self::StreamBookStream>, Status> {
        let depth = {
            let d = request.into_inner().depth as usize;
            if d == 0 { self.book_depth } else { d }
        };
        let mut rx = self.book_update_tx.subscribe();
        let engine = self.engine.clone();
        let stream = async_stream::stream! {
            loop {
                // Wait for a notification (ignore errors from lagging)
                let _ = rx.recv().await;
                let (bids, asks) = engine.snapshot_top(depth).await;
                yield Ok(BookSnapshot {
                    bids: bids.iter().map(|(price, count)| PriceLevel { price: price.into_inner(), count: *count as u32 }).collect(),
                    asks: asks.iter().map(|(price, count)| PriceLevel { price: price.into_inner(), count: *count as u32 }).collect(),
                });
            }
        };
        Ok(Response::new(Box::pin(stream) as Self::StreamBookStream))
    }
}

impl MyClobService {
    pub fn new(engine: Arc<Engine>, book_depth: usize, book_update_tx: broadcast::Sender<()>) -> Self {
        Self { engine, book_depth, book_update_tx }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // Read config
    let config_str = fs::read_to_string("config.toml").unwrap_or_default(); // TODO - change to .config.local and .secrets.local
    let config: Value = toml::from_str(&config_str).unwrap_or(Value::Table(Default::default()));
    
    let tokio_channel_capacity: usize = config.get("tokio_channel_capacity").and_then(|v| v.as_integer()).unwrap() as usize;
    let grpc_host = config.get("grpc_host").and_then(|v| v.as_str()).unwrap();
    let grpc_port = config.get("grpc_port").and_then(|v| v.as_integer()).unwrap() as u16;
    let book_depth = config.get("book_depth_default").and_then(|v| v.as_integer()).unwrap() as usize;
    
    let engine = Arc::new(Engine::new());
    
    let (book_update_tx, _) = broadcast::channel(tokio_channel_capacity);
    let clob_service = MyClobService::new(engine, book_depth, book_update_tx.clone());
    
    tracing::info!("{} <{}> {}", Utc::now(), "LISTENING", format!("{}:{}", grpc_host, grpc_port));

    // NATS setup
    let nats_host = config.get("nats_host").and_then(|v| v.as_str()).unwrap_or("127.0.0.1");
    let nats_port = config.get("nats_port").and_then(|v| v.as_integer()).unwrap_or(4222) as u16;
    
    // NATS connection
    let nats = initialize_nats(nats_host, nats_port).await?;
    // authenticated nats:
    // let client = initialize_nats_with_auth(nats_host, nats_port, Some("myuser"), Some("mypass")).await?;
    
    // Setup NATS order processing
    clob::nats::setup_order_processing(nats, "clob.orders".into()).await?;
    
    Server::builder()
        .add_service(ClobServer::new(clob_service))
        .serve(format!("{}:{}", grpc_host, grpc_port).parse()?)
        .await?;
    Ok(())
}
