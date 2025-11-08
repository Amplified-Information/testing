use tonic::{Request, Response, Status};
use tokio_stream::wrappers::ReceiverStream;
use tokio::sync::mpsc;
use crate::orderbook::OrderBookService;
use crate::orderbook::proto::{OrderRequest, OrderResponse, BookRequest, BookSnapshot, clob_server::{Clob, ClobServer}};

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
impl Clob for ClobService {
    async fn place_order(
        &self,
        request: Request<OrderRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let order = request.into_inner();
        self.order_book_service.place_order(order).await;

        let response = OrderResponse {
            status: "success".to_string(),
            error: String::new(),
        };

        Ok(Response::new(response))
    }

    async fn get_book(
        &self,
        _request: Request<BookRequest>,
    ) -> Result<Response<BookSnapshot>, Status> {
        let snapshot = self.order_book_service.get_book().await;
        Ok(Response::new(snapshot))
    }

    type StreamBookStream = ReceiverStream<Result<BookSnapshot, Status>>;

    async fn stream_book(
        &self,
        _request: Request<BookRequest>,
    ) -> Result<Response<Self::StreamBookStream>, Status> {
        let (tx, rx) = mpsc::channel(128);

        tokio::spawn(async move {
            // Example: send periodic updates
            loop {
                let snapshot = BookSnapshot {
                    bids: vec![],
                    asks: vec![],
                };

                if tx.send(Ok(snapshot)).await.is_err() {
                    break;
                }

                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        });

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}

pub fn create_service(order_book_service: OrderBookService) -> impl Future<Output = Result<(), Box<dyn std::error::Error>>> {
    let addr = "0.0.0.0:50051".parse().unwrap();
    futures_util::TryFutureExt::map_err(tonic::transport::Server::builder()
        .add_service(ClobServer::new(ClobService::new(order_book_service)))
        .serve(addr), |e| Box::new(e) as Box<dyn std::error::Error>)
}
