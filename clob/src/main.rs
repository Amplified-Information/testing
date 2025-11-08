mod grpc_service;
mod nats_listener;
mod orderbook;

use grpc_service::create_service;
use nats_listener::start_nats_listener;
use orderbook::OrderBookService;
use tokio::join;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let order_book_service = OrderBookService::new();

    let grpc_server = create_service(order_book_service.clone());
    let nats_listener = start_nats_listener(order_book_service);

    let (grpc_result, nats_result) = join!(grpc_server, nats_listener);

    grpc_result?;
    nats_result?;

    Ok(())
}
