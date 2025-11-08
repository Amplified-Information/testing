mod grpc_service;
mod nats_listener;
mod orderbook;

use grpc_service::create_service;
use nats_listener::start_nats_listener;
use orderbook::OrderBookService;
use tokio::join;
use simple_logger::SimpleLogger;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    SimpleLogger::new().init().unwrap();

    let port = std::env::var("PORT").unwrap_or_else(|_| panic!("Failed to read env var PORT"));
    let host = std::env::var("HOST").unwrap_or_else(|_| panic!("Failed to read env var HOST"));
    let subject: String = std::env::var("NATS_SUBJECT").unwrap_or_else(|_| panic!("Failed to read env var NATS_SUBJECT"));

    let order_book_service = OrderBookService::new();

    let grpc_server = create_service(&host, &port, order_book_service.clone());
    log::info!("START \t CLOB service running on port {}:{}", host, port);
    let nats_listener = start_nats_listener(order_book_service, subject);

    let (grpc_result, nats_result) = join!(grpc_server, nats_listener);
    grpc_result?;
    nats_result?;

    Ok(())
}
