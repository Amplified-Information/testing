use crate::orderbook::{OrderBookService, proto::OrderRequest};
use async_nats::ServerAddr;
use futures_util::StreamExt;

pub async fn start_nats_listener(order_book_service: OrderBookService, subject: String) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("NATS \t listening on: \"{}\"", subject);
    let nats_client = async_nats::connect("0.0.0.0:4222".parse::<ServerAddr>()?).await?;

    let mut subscriber = nats_client.subscribe(subject).await?;

    while let Some(message) = subscriber.next().await {
        match serde_json::from_slice::<OrderRequest>(&message.payload) {
            Ok(order) => {
                log::info!("EVENT OrderRequest: {:?}", order);
                order_book_service.place_order(OrderRequest {
                    tx_id: order.tx_id,
                    market_id: order.market_id,
                    account_id: order.account_id,
                    market_limit: order.market_limit,
                    price_usd: order.price_usd,
                    qty: order.qty,
                }).await;
            }
            Err(err) => {
                log::error!("Failed to deserialize message payload: {:?}, error: {}", message.payload, err);
            }
        }
    }
    
    Ok(())
}
