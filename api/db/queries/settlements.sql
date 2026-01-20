-- name: CreateSettlement :exec
INSERT INTO settlements (tx_id1, tx_id2, tx_hash)
VALUES ($1, $2, $3);
