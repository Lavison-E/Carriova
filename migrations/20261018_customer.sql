CREATE TABLE IF NOT EXISTS customer_users (
 id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(255) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true,
 consent_privacy BOOLEAN NOT NULL, consent_marketing BOOLEAN NOT NULL DEFAULT false,
 consent_version VARCHAR(40) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_sessions (
 token_hash VARCHAR(64) PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_sessions_expiry_idx ON customer_sessions(expires_at);
CREATE TABLE IF NOT EXISTS customer_lead_claims (
 token_hash VARCHAR(64) PRIMARY KEY, lead_id INTEGER NOT NULL UNIQUE REFERENCES leads(id),
 expires_at TIMESTAMPTZ NOT NULL, claimed_at TIMESTAMPTZ, customer_id INTEGER REFERENCES customer_users(id)
);
CREATE INDEX IF NOT EXISTS customer_claims_expiry_idx ON customer_lead_claims(expires_at);
CREATE TABLE IF NOT EXISTS customer_reset_tokens (
 token_hash VARCHAR(64) PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS customer_reset_expiry_idx ON customer_reset_tokens(expires_at);
