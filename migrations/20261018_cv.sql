-- Additive CV storage; the migration runner owns the transaction and advisory lock.
CREATE TABLE IF NOT EXISTS cv_documents (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
  title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  template_id varchar(24) NOT NULL DEFAULT 'essentiel' CHECK (template_id IN ('essentiel','horizon','signature')),
  accent varchar(24) NOT NULL DEFAULT 'terracotta' CHECK (accent IN ('terracotta','petrol','slate')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cv_documents_customer_updated_idx ON cv_documents(customer_id, updated_at);
CREATE TABLE IF NOT EXISTS cv_ai_runs (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
  document_id integer REFERENCES cv_documents(id) ON DELETE SET NULL,
  document_version integer NOT NULL CHECK (document_version >= 0),
  request_id varchar(36) NOT NULL,
  status varchar(16) NOT NULL CHECK (status IN ('running','succeeded','failed')),
  lease_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  model varchar(160),
  input_tokens integer CHECK (input_tokens >= 0),
  output_tokens integer CHECK (output_tokens >= 0),
  error_code varchar(80)
);
CREATE UNIQUE INDEX IF NOT EXISTS cv_ai_runs_customer_request_idx ON cv_ai_runs(customer_id, request_id);
CREATE INDEX IF NOT EXISTS cv_ai_runs_customer_created_idx ON cv_ai_runs(customer_id, created_at);
CREATE INDEX IF NOT EXISTS cv_ai_runs_created_idx ON cv_ai_runs(created_at);
