use async_nats::Client;
use std::error::Error;
use tokio::time::{timeout, Duration};
use futures_util::StreamExt;

use crate::clob_proto::{OrderRequest, clob_server::Clob};

// Macro to generate protobuf code for the api module
pub mod api_proto {
    tonic::include_proto!("api");
}

/// Initialize NATS connection with host and port
/// 
/// # Arguments
/// * `nats_host` - The NATS server hostname or IP address
/// * `nats_port` - The NATS server port number
/// 
/// # Returns
/// * `Result<Client, Box<dyn Error>>` - NATS client on success, error on failure
/// 
/// # Examples
/// ```
/// let client = initialize_nats("localhost", 4222).await?;
/// ```
pub async fn initialize_nats(nats_host: &str, nats_port: u16) -> Result<Client, Box<dyn Error>> {
    let nats_url = format!("nats://{}:{}", nats_host, nats_port);
    
    tracing::info!("Connecting to NATS server at {}", nats_url);
    
    // Set a connection timeout of 10 seconds
    let client = timeout(Duration::from_secs(10), async {
        async_nats::connect(&nats_url).await
    })
    .await
    .map_err(|_| "NATS connection timeout")?
    .map_err(|e| format!("Failed to connect to NATS: {}", e))?;
    
    tracing::info!("Successfully connected to NATS server at {}", nats_url);
    
    Ok(client)
}

/// Initialize NATS connection with optional authentication
/// 
/// # Arguments
/// * `nats_host` - The NATS server hostname or IP address
/// * `nats_port` - The NATS server port number
/// * `username` - Optional username for authentication
/// * `password` - Optional password for authentication
/// 
/// # Returns
/// * `Result<Client, Box<dyn Error>>` - NATS client on success, error on failure
pub async fn initialize_nats_with_auth(
    nats_host: &str, 
    nats_port: u16, 
    username: Option<&str>, 
    password: Option<&str>
) -> Result<Client, Box<dyn Error>> {
    let nats_url = match (username, password) {
        (Some(user), Some(pass)) => format!("nats://{}:{}@{}:{}", user, pass, nats_host, nats_port),
        _ => format!("nats://{}:{}", nats_host, nats_port),
    };
    
    tracing::info!("Connecting to NATS server at {}:{}", nats_host, nats_port);
    
    // Set a connection timeout of 10 seconds
    let client = timeout(Duration::from_secs(10), async {
        async_nats::connect(&nats_url).await
    })
    .await
    .map_err(|_| "NATS connection timeout")?
    .map_err(|e| format!("Failed to connect to NATS: {}", e))?;
    
    tracing::info!("Successfully connected to NATS server at {}:{}", nats_host, nats_port);
    
    Ok(client)
}

/// Setup NATS order processing to listen for incoming orders
/// 
/// # Arguments
/// * `nats_client` - Connected NATS client
/// 
/// # Returns
/// * `Result<(), Box<dyn Error>>` - Success or error
pub async fn setup_order_processing(
    nats_client: Client,
    clob_service: impl Clob + Send + Sync + 'static,
    subject: String
) -> Result<(), Box<dyn Error>> {
    // Subscribe to the orders topic
    let mut subscriber = nats_client.subscribe(subject.clone()).await?;
    tracing::info!("Subscribed to NATS subject: {}", subject);
    
        tokio::spawn({
            // let clob_service = clob_service.clone();
            async move {
                while let Some(message) = subscriber.next().await {
                    match serde_json::from_slice::<api_proto::PredictionIntentRequest>(&message.payload) {
                        Ok(nats_order) => {
                            // Received NATS order
                            tracing::info!("Received NATS order: {:?}", nats_order);

                            // Process order (directly place order via gRPC)
                            match clob_service.place_order(tonic::Request::new(OrderRequest {
                                tx_id: nats_order.tx_id,
                                account_id: nats_order.account_id,
                                price_usd: nats_order.price_usd,
                                n_shares: nats_order.n_shares,
                                market_id: nats_order.market_id,
                                market_limit: nats_order.market_limit,
                            })).await {
                                Ok(response) => {
                                    tracing::info!("Order placed successfully: {:?}", response);
                                }
                                Err(e) => {
                                    tracing::error!("Failed to place order: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            tracing::error!("Failed to deserialize NATS order message: {}", e);
                            tracing::debug!("Raw payload: {}", String::from_utf8_lossy(&message.payload));
                        }
                    }
                }
            }
        });
        tracing::info!("NATS order processing setup completed");
    Ok(())
}
