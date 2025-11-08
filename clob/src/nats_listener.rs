use crate::orderbook::{OrderBookService, proto::OrderRequest};
use futures_util::StreamExt;

pub async fn start_nats_listener(order_book_service: OrderBookService) -> Result<(), Box<dyn std::error::Error>> {
    let nats_client = async_nats::connect("localhost:4222").await?;

    let mut subscriber = nats_client.subscribe("orders").await?;

    while let Some(message) = subscriber.next().await {
        // let order = OrderRequest::decode(&*message.payload)?;
        let order: OrderRequest = serde_json::from_slice(&message.payload)?;

        println!("Received message {:?}", order);
        order_book_service.process_nats_order(order).await;
    }
    
    Ok(())
}
