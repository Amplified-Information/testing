-- name: InsertPrice :exec
INSERT INTO price_history (market_id, price, ts)
VALUES ($1, $2, $3);


-- name: InsertPriceReturn :one
INSERT INTO price_history (market_id, price, ts)
VALUES ($1, $2, $3)
RETURNING market_id, price, ts;


-- name: GetLatestPriceByMarket :one
SELECT market_id, price, ts
FROM price_history
WHERE market_id = $1
ORDER BY ts DESC
LIMIT 1;


-- name: GetPricesByMarketInRange :many
SELECT market_id, price, ts
FROM price_history
WHERE market_id = $1
  AND ts >= $2
  AND ts <  $3
ORDER BY ts ASC;


-- name: GetPricesByMarketSince :many
-- convenience: fetch from a given time until now
SELECT market_id, price, ts
FROM price_history
WHERE market_id = $1
  AND ts >= $2
ORDER BY ts ASC;


-- name: GetLatestPricesForMarkets :many
-- fetch the latest price for each of the given markets
WITH latest AS (
  SELECT DISTINCT ON (market_id) market_id, price, ts
  FROM price_history
  WHERE market_id = ANY($1)
  ORDER BY market_id, ts DESC
)
SELECT market_id, price, ts
FROM latest;


-- name: GetGlobalPricesSince :many
-- fetch all prices (all markets) since a given timestamp
SELECT market_id, price, ts
FROM price_history
WHERE ts >= $1
ORDER BY ts ASC;


-- name: DeletePricesBefore :exec
-- Not usually required if you drop partitions, but useful if you store in a single table
DELETE FROM price_history
WHERE ts < $1;
