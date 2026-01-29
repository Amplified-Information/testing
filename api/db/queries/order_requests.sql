-- name: CreateOrderRequest :one
INSERT INTO order_requests (tx_id, net, market_id, account_id, market_limit, price_usd, qty, sig, public_key_hex, evmaddress, keytype, generated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: IsDuplicateTxId :one
SELECT COUNT(*) > 0 AS exists
FROM order_requests
WHERE tx_id = $1;

-- name: CancelOrderIntent :exec
UPDATE order_requests
SET cancelled_at = CURRENT_TIMESTAMP
WHERE tx_id = $1 AND cancelled_at IS NULL;

-- name: GetAllPredictionIntentsByMarketId :many
SELECT *
FROM order_requests
WHERE market_id = $1 AND cancelled_at IS NULL;

-- name: MarkPredictionIntentAsRegenerated :exec
UPDATE order_requests
SET regenerated_at = CURRENT_TIMESTAMP
WHERE tx_id = $1;

-- name: MarkOrderRequestAsFullyMatched :one
UPDATE order_requests
SET fully_matched_at = CURRENT_TIMESTAMP
WHERE market_id = $1 AND tx_id = $2
RETURNING *;

-- name: GetLivePredictionIntentsByMarketIdSortedByAccountID :many
SELECT *
FROM order_requests
WHERE market_id = $1 AND cancelled_at IS NULL AND fully_matched_at IS NULL
ORDER BY account_id;