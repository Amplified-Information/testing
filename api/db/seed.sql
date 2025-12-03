-- Seed data for the markets table
INSERT INTO markets (market_id, statement, is_open, created_at, resolved_at)
VALUES
  ('0189c0a8-7e80-7e80-8000-000000000001', 'Will the price of BTC exceed $50,000 by the end of the year?', TRUE, CURRENT_TIMESTAMP, NULL),
  ('0189c0a8-7e80-7e80-8000-000000000002', 'Will the next US election result in a Democratic president?', TRUE, CURRENT_TIMESTAMP, NULL),
  ('0189c0a8-7e80-7e80-8000-000000000003', 'Will Ethereum switch to Proof of Stake by the end of the year?', FALSE, CURRENT_TIMESTAMP, '2025-01-01 00:00:00');
