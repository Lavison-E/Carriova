CREATE TABLE IF NOT EXISTS staff_users (
 id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'advisor' CHECK (role IN ('admin','advisor')),
 enabled BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_sessions (
 token_hash VARCHAR(64) PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_sessions_expiry_idx ON staff_sessions(expires_at);
CREATE TABLE IF NOT EXISTS staff_login_attempts (
 key VARCHAR(64) PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 1, reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_login_attempts_expiry_idx ON staff_login_attempts(reset_at);
