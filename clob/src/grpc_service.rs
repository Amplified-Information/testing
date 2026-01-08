use futures_util::TryFutureExt;
use tonic::{Request, Response, Status};
use tokio_stream::wrappers::ReceiverStream;
use tokio::sync::mpsc;
use crate::orderbook::OrderBookService;
use crate::orderbook::proto::clob_internal_server::ClobInternalServer;
use crate::orderbook::proto::clob_public_server::ClobPublicServer;
use crate::orderbook::proto::{OrderRequestClob, StdResponse, BookRequest, BookSnapshot, clob_public_server::{ClobPublic}, clob_internal_server::{ClobInternal}};

#[derive(Debug, Clone)]
pub struct ClobService {
    order_book_service: OrderBookService,
}

impl ClobService {
    pub fn new(order_book_service: OrderBookService) -> Self {
        Self { order_book_service }
    }
}

#[tonic::async_trait]
impl ClobInternal for ClobService {
    async fn place_order(
        &self,
        request: Request<OrderRequestClob>,
    ) -> Result<Response<StdResponse>, Status> {
        let order = request.into_inner();
        
        let result = self.order_book_service.place_order(order).await;
        if let Err(e) = result {
            log::error!("Failed to place order: {}", e);
            return Err(Status::internal(e.to_string()));
        }
        let response = StdResponse {
            message: "success".to_string(),
            error_code: 0,
        };

        Ok(Response::new(response))
    }

    async fn add_market(
        &self,
        request: Request<crate::orderbook::proto::MarketRequest>,
    ) -> Result<Response<crate::orderbook::proto::StdResponse>, Status> {
        
        // Guards
        let inner = request.into_inner();
        
        let result = self.order_book_service.add_market(inner.market_id.clone(), inner.net.clone()).await;
        
        match result {
            Ok(success) if success => (),
            _ => {
                log::error!("Failed to add market");
                return Err(Status::internal("Failed to add market. Does the market already exist?"));
            }
        }
        let response = crate::orderbook::proto::StdResponse {
            message: "success".to_string(),
            error_code: 0,
        };

        Ok(Response::new(response))
    }
}

#[tonic::async_trait]
impl ClobPublic for ClobService {
    async fn health(
        &self,
        _request: Request<crate::orderbook::proto::Empty>,
    ) -> Result<Response<StdResponse>, Status> {
        let response = StdResponse {
            message: "OK".to_string(),
            error_code: 0,
        };
        Ok(Response::new(response))
    }

    async fn get_book(
        &self,
        _request: Request<BookRequest>,
    ) -> Result<Response<BookSnapshot>, Status> {

        let inner = _request.into_inner();

        let snapshot = self.order_book_service.get_book(&inner.market_id, &inner.net, inner.depth as usize).await;
        match snapshot {
            Ok(snapshot) => Ok(Response::new(snapshot)),
            Err(e) => {
                log::error!("Failed to get book snapshot: {}:{} {}", inner.net, inner.market_id, e);
                Err(Status::internal(e.to_string()))
            }
        }
    }

    type StreamBookStream = ReceiverStream<Result<BookSnapshot, Status>>;

    async fn stream_book(
        &self,
        _request: Request<BookRequest>,
    ) -> Result<Response<Self::StreamBookStream>, Status> {
        let (tx, rx) = mpsc::channel(128);
        let order_book_service = self.order_book_service.clone();
        
        let inner = _request.into_inner();

        tokio::spawn(async move {
            loop {
                let snapshot = order_book_service.get_book(&inner.market_id, &inner.net, inner.depth as usize).await;

                let result = snapshot.map_err(|e| {
                     log::error!("Failed to get book snapshot: {}:{} {}", inner.net, inner.market_id, e);
                    Status::internal(e.to_string())
                });

                if tx.send(result).await.is_err() {
                    break;
                }

                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        });

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}

pub fn start_grpc(host: &str, port: &str, order_book_service: OrderBookService) -> impl Future<Output = Result<(), Box<dyn std::error::Error>>> {
    let addr = format!("{}:{}", host, port).parse().unwrap();
    log::info!("Starting gRPC server on {}", addr);

    tonic::transport::Server::builder()
        .add_service(ClobInternalServer::new(ClobService::new(order_book_service.clone())))
        .add_service(ClobPublicServer::new(ClobService::new(order_book_service)))
        .serve(addr)
        .map_err(|e| {
            log::error!("Failed to start gRPC server: {}", e);
            Box::new(e) as Box<dyn std::error::Error>
        })
}
