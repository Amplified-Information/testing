-- name: CreateOrderRequest :one
INSERT INTO order_requests (tx_id, net, market_id, account_id, market_limit, price_usd, qty, sig, generated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: IsDuplicateTxId :one
SELECT COUNT(*) > 0 AS exists
FROM order_requests
WHERE tx_id = $1;
