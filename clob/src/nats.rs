use crate::{constants, orderbook::{OrderBookService, proto::OrderRequestClob}};
use async_nats::ServerAddr;
use futures_util::StreamExt;

#[derive(Debug, Clone)]
pub struct NatsService {
    pub(crate) nats_client: async_nats::Client
}

impl NatsService {
    pub async fn new(nats_host: &str, nats_port: &str) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let nats_address = format!("{}:{}", nats_host, nats_port);
        log::info!("NATS \t Connecting to: {}", nats_address);
        let _nats_client = async_nats::connect(nats_address.parse::<ServerAddr>()?).await?;
        Ok(Self { nats_client: _nats_client })
    }

    // pub async fn init_nats(nats_host: &str, nats_port: &str) -> Result<async_nats::Client, Box<dyn std::error::Error + Send + Sync>> {
    //     let nats_address = format!("{}:{}", nats_host, nats_port);
    //     log::info!("NATS \t Connecting to: {}", nats_address);
    //     let nats_client = async_nats::connect(nats_address.parse::<ServerAddr>()?).await?;
    //     Ok(nats_client)
    // }

    pub async fn subscribe_and_place_orders(
        nats: &async_nats::Client,
        order_book_service: OrderBookService,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        log::info!("NATS \t Listening on: \"{}\"", constants::CLOB_ORDERS);

        let mut subscriber = nats.subscribe(constants::CLOB_ORDERS.to_string()).await?;

        while let Some(message) = subscriber.next().await {
            match serde_json::from_slice::<OrderRequestClob>(&message.payload) {
                Ok(order) => {
                    let _ = order_book_service.place_order(OrderRequestClob {
                            tx_id: order.tx_id,
                            net: order.net,
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

    pub async fn publish_match(&self, is_partial_match: bool, orc1: &OrderRequestClob, orc2: &OrderRequestClob) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let orders: Vec<OrderRequestClob> = vec![orc1.clone(), orc2.clone()]; // Create a vector of OrderRequestClob
        let payload = serde_json::to_vec(&orders).unwrap();
        let _ = self.nats_client.publish(if is_partial_match { constants::CLOB_MATCHES_PARTIAL } else { constants::CLOB_MATCHES }, payload.into()).await;
        log::info!("NATS \t Published MATCH for order: {:?}", orc1);
        Ok(())
    }
}