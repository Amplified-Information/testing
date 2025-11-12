CREATE TABLE IF NOT EXISTS order_requests (
  id SERIAL PRIMARY KEY,
  tx_id UUID NOT NULL,
  market_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  market_limit TEXT NOT NULL CHECK (market_limit IN ('market', 'limit')),
  price_usd DOUBLE PRECISION NOT NULL CHECK (price_usd BETWEEN -1.0 AND 1.0),
  qty DOUBLE PRECISION NOT NULL CHECK (qty > 0.0), -- Note: exactly 0.0 is not a valid qty
  generated_at TIMESTAMPTZ NOT NULL,
  sig TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
