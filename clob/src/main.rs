use std::sync::Arc;
use std::fs;
use toml::Value;
use tonic::{transport::Server, Request, Response, Status};

use clob::clob_proto::clob_server::{Clob, ClobServer};
use clob::clob_proto::OrderRequest;
use clob::clob_proto::BookSnapshot;
use clob::clob_proto::BookRequest;
use clob::clob_proto::OrderResponse;
use clob::clob_proto::PriceLevel;
use clob::Engine;
use chrono::{Utc};

use futures_core::Stream;
use std::pin::Pin;

use tokio::sync::broadcast;

use clob::nats::initialize_nats;

#[derive(Clone)]
pub struct MyClobService {
    engine: Arc<Engine>,
    book_depth: usize,
    book_update_tx: broadcast::Sender<()>,
}

// fn proto_to_engine_order_request(req: OrderRequest) -> Result<EngineOrderRequest, Status> {
//     Ok(EngineOrderRequest {
//         tx_id: req.tx_id,
//         account_id: req.account_id,
//         price_usd: req.price_usd.into(),
//         n_shares: req.n_shares.into(),
//     })
// }

#[tonic::async_trait]
impl Clob for MyClobService {
    type StreamBookStream = Pin<Box<dyn Stream<Item = Result<BookSnapshot, Status>> + Send + 'static>>;

    async fn place_order(&self, request: Request<OrderRequest>) -> Result<Response<OrderResponse>, Status> {
        let proto_req = request.into_inner();
        
        // Validate required fields
        if proto_req.tx_id.is_empty() {
            return Err(Status::invalid_argument("tx_id cannot be empty"));
        }
        if proto_req.price_usd == 0.0 {
            return Err(Status::invalid_argument("price_usd cannot be zero"));
        }
        if proto_req.n_shares == 0.0 {
            return Err(Status::invalid_argument("n_shares cannot be zero"));
        }

        
        tracing::info!("{} <{}> {:?}", Utc::now(), "ORDER_CREATED", proto_req);

        
        // Convert proto OrderRequest to engine OrderRequest - use the clob crate's version
        let engine_req = clob::clob_proto::OrderRequest {
            tx_id: proto_req.tx_id,
            market_id: proto_req.market_id,
            account_id: proto_req.account_id,
            market_limit: proto_req.market_limit,
            price_usd: proto_req.price_usd,
            n_shares: proto_req.n_shares,
        };

        let trades = self.engine.try_match(Some(engine_req)).await;
        let status = if trades.is_empty() { "ACCEPTED" } else { "MATCHED" };

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
    let clob_service = Arc::new(MyClobService::new(engine, book_depth, book_update_tx.clone()));
    
    tracing::info!("{} <{}> {}", Utc::now(), "LISTENING", format!("{}:{}", grpc_host, grpc_port));

    // // configure protobufs
    // tonic_build::configure()
    // .compile_with_config(
    //     // serde for protobuf objects
    //     prost_build::Config::new().type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]"),
    //     &["proto/api.proto"],
    //     &["proto"],
    // )
    // .unwrap();

    // NATS setup
    let nats_host = config.get("nats_host").and_then(|v| v.as_str()).unwrap_or("127.0.0.1");
    let nats_port = config.get("nats_port").and_then(|v| v.as_integer()).unwrap_or(4222) as u16;
    
    // NATS connection
    let nats = initialize_nats(nats_host, nats_port).await?;
    // authenticated nats:
    // let client = initialize_nats_with_auth(nats_host, nats_port, Some("myuser"), Some("mypass")).await?;
    
    // Setup NATS order processing
    clob::nats::setup_order_processing(nats, (*clob_service).clone(), "clob.orders".into()).await?;
    
    Server::builder()
        .add_service(ClobServer::new((*clob_service).clone()))
        .serve(format!("{}:{}", grpc_host, grpc_port).parse()?)
        .await?;
    Ok(())
}
