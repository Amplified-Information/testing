-- name: CreateMatch :one
INSERT INTO matches (tx_id1, tx_id2, is_partial)
VALUES ($1, $2, $3)
RETURNING *;
