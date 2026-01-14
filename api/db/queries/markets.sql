-- name: GetMarket :one
SELECT * FROM markets
WHERE market_id = $1;

-- name: GetMarkets :many
SELECT * FROM markets
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateMarket :one
INSERT INTO markets (market_id, net, statement, image_url, smart_contract_id, is_paused, created_at, resolved_at)
VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP, NULL)
RETURNING *;

-- name: CountUnresolvedMarkets :one
SELECT COUNT(*) FROM markets
WHERE resolved_at IS NULL;

-- name: GetAllUnresolvedMarkets :many
SELECT * FROM markets
WHERE resolved_at IS NULL
ORDER BY created_at ASC;
-- LIMIT $1 OFFSET $2;
