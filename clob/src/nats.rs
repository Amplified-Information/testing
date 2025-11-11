use crate::{constants, orderbook::{OrderBookService, proto::OrderRequest}};
use async_nats::ServerAddr;
use futures_util::StreamExt;

pub async fn init_nats(nats_host: &str, nats_port: &str) -> Result<async_nats::Client, Box<dyn std::error::Error + Send + Sync>> {
    let nats_address = format!("{}:{}", nats_host, nats_port);
    log::info!("NATS \t Connecting to: {}", nats_address);
    let nats_client = async_nats::connect(nats_address.parse::<ServerAddr>()?).await?;
    Ok(nats_client)
}

pub async fn subscribe_and_place_orders(
    nats: &async_nats::Client,
    order_book_service: OrderBookService,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    log::info!("NATS \t Listening on: \"{}\"", constants::CLOB_ORDERS);

    let mut subscriber = nats.subscribe(constants::CLOB_ORDERS.to_string()).await?;

    while let Some(message) = subscriber.next().await {
        match serde_json::from_slice::<OrderRequest>(&message.payload) {
            Ok(order) => {
                log::info!("EVENT OrderRequest: {:?}", order);
                let _ = order_book_service.place_order(OrderRequest {
                        tx_id: order.tx_id,
                        market_id: order.market_id,
                        account_id: order.account_id,
                        market_limit: order.market_limit,
                        price_usd: order.price_usd,
                        qty: order.qty,
                    })
                    .await;
            }
            Err(err) => {
                log::error!(
                    "Failed to deserialize message payload: {:?}, error: {}",
                    message.payload, err
                );
            }
        }
    }

    Ok(())
}
