ALTER TABLE order_requests
ADD COLUMN net TEXT NOT NULL DEFAULT 'testnet' CHECK (net IN ('mainnet', 'testnet', 'previewnet'));