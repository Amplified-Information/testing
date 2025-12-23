use uuid;

pub fn is_valid_poly_id(poly_id: String) -> bool {
  // market_id must conform to this format: <previewnet|testnet|mainnet>:<UUID>
  if poly_id.split(':').collect::<Vec<&str>>().len() != 2 {
      log::error!("Invalid poly_id format: {}. Expected format: <hederaNetwork_lowercase>:<UUID>", poly_id);
      return false;
  }
  let parts: Vec<&str> = poly_id.split(':').collect();
  let network = parts[0];
  let uuid = parts[1];
  if network != "previewnet" && network != "testnet" && network != "mainnet" {
      log::error!("Invalid network in poly_id: {}. Expected one of: previewnet, testnet, mainnet", network);
      return false;
  }
  if uuid.len() != 36 {
    return false;
  } else {  
    if uuid::Uuid::parse_str(uuid).is_err() {
        log::error!("Invalid UUID in poly_id: {}. Expected a valid UUID format", uuid);
        return false;
    }
  }
  return true;
}