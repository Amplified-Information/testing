-- name: GetMarket :one
SELECT * FROM markets
WHERE market_id = $1;

-- name: GetMarkets :many
SELECT * FROM markets
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateMarket :one
INSERT INTO markets (market_id, net, statement, is_open, created_at, resolved_at)
VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP, NULL)
RETURNING *;
