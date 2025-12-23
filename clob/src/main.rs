mod grpc_service;
mod nats;
mod orderbook;
mod constants;
pub mod utils;

use orderbook::OrderBookService;
use simple_logger::SimpleLogger;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    SimpleLogger::new().init().unwrap();

    let port = std::env::var("CLOB_PORT").unwrap_or_else(|_| panic!("Failed to read env var CLOB_PORT"));
    let host = std::env::var("CLOB_HOST").unwrap_or_else(|_| panic!("Failed to read env var CLOB_HOST"));
    let nats_host: String = std::env::var("NATS_HOST").unwrap_or_else(|_| panic!("Failed to read env var NATS_HOST"));
    let nats_port: String = std::env::var("NATS_PORT").unwrap_or_else(|_| panic!("Failed to read env var NATS_PORT"));
    // let clob_matching_interval_seconds: u64 = std::env::var("CLOB_MATCHING_INTERVAL_SECONDS").unwrap_or_else(|_| "5".to_string()).parse().unwrap_or_else(|_| panic!("Failed to read env var CLOB_MATCHING_INTERVAL_SECONDS"));

    // init NATS service
    let nats_service = nats::NatsService::new(&nats_host, &nats_port).await
        .expect("Failed to initialize NATS service");
    
    // init orderbook service
    let order_book_service = OrderBookService::new(nats_service.clone()).await;

    // Start the periodic orderbook scan
    // TODO - re-enable
    // let order_book_service_for_scan = order_book_service.clone();
    // let orderbook_scan_task = tokio::spawn(async move {
    //     log::info!("Starting periodic orderbook scan...");
    //     let result = order_book_service_for_scan.start_periodic_scan(clob_matching_interval_seconds).await;
    //     if let Err(e) = result {
    //         log::error!("Orderbook scan failed: {}", e);
    //     }
    // });

    // NATS: listen for new orders to add to orderbook
    let order_book_service_for_nats = order_book_service.clone();
    let nats_task = tokio::spawn(async move {
        let result = nats::NatsService::subscribe_and_place_orders(&nats_service.nats_client, order_book_service_for_nats).await;
        if let Err(e) = result {
            log::error!("NATS subscription failed: {}", e);
        }
    });

    // Start the gRPC server
    let order_book_service_for_grpc = order_book_service.clone();
    let grpc_server_task = tokio::spawn(async move {
        log::info!("Starting gRPC server on {}:{}", host, port);
        let result = grpc_service::start_grpc(&host, &port, order_book_service_for_grpc).await;
        if let Err(e) = result {
            log::error!("gRPC server failed: {}", e);
        }
    });

    // Run all tasks concurrently
    let _ = tokio::try_join!(/*orderbook_scan_task,*/ grpc_server_task, nats_task);

    Ok(())
}
