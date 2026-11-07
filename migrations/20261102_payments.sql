-- Payment ledger is independent from request lifecycle; accepting a quote never means paid.
CREATE TABLE IF NOT EXISTS request_payments (
 id UUID PRIMARY KEY, request_id INTEGER NOT NULL REFERENCES service_requests(id),
 customer_id INTEGER NOT NULL REFERENCES customer_users(id),
 environment VARCHAR(10) NOT NULL CHECK (environment IN ('sandbox','live')),
 stage VARCHAR(10) NOT NULL CHECK (stage IN ('full','deposit','balance')),
 amount INTEGER NOT NULL CHECK (amount >= 200), quote_amount INTEGER NOT NULL CHECK (quote_amount >= amount),
 currency VARCHAR(3) NOT NULL DEFAULT 'XOF' CHECK (currency = 'XOF'),
 status VARCHAR(20) NOT NULL DEFAULT 'creating' CHECK (status IN ('creating','pending','processing','completed','failed','expired','cancelled','refunded','review_required')),
 provider_reference VARCHAR(100), checkout_url TEXT, expires_at TIMESTAMPTZ, paid_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS request_payments_reference_idx ON request_payments(provider_reference);
CREATE INDEX IF NOT EXISTS request_payments_request_idx ON request_payments(request_id, environment);
-- Only a verified terminal failure allows another attempt; unknown creation never retries automatically.
CREATE UNIQUE INDEX IF NOT EXISTS request_payments_open_stage_idx ON request_payments(request_id, environment, stage)
 WHERE status IN ('creating','pending','processing');
CREATE TABLE IF NOT EXISTS payment_webhook_events (
 id VARCHAR(100) PRIMARY KEY, environment VARCHAR(10) NOT NULL CHECK (environment IN ('sandbox','live')),
 reference VARCHAR(100) NOT NULL, event VARCHAR(60) NOT NULL, payload_hash VARCHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
