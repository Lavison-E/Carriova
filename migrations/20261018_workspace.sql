-- Additive migration. The runner supplies the transaction and schema prerequisites.
DO $$ BEGIN
  IF to_regclass('customer_users') IS NULL OR to_regclass('leads') IS NULL THEN
    RAISE EXCEPTION 'Les tables customer_users et leads doivent exister avant l’espace client.';
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS service_requests (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id),
  lead_id integer REFERENCES leads(id),
  title varchar(160) NOT NULL CHECK (length(title) BETWEEN 3 AND 160),
  service varchar(40) NOT NULL,
  brief text NOT NULL CHECK (length(brief) BETWEEN 10 AND 10000),
  status varchar(40) NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','quoted','in_progress','delivered','revision_requested','completed','cancelled')),
  quoted_amount integer CHECK (quoted_amount >= 0),
  due_at timestamptz,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS service_requests_lead_idx ON service_requests(lead_id);
CREATE INDEX IF NOT EXISTS service_requests_customer_idx ON service_requests(customer_id,created_at);
CREATE INDEX IF NOT EXISTS service_requests_status_idx ON service_requests(status,updated_at);
COMMENT ON COLUMN service_requests.quoted_amount IS 'Proposition en francs CFA (XOF). NULL = prix non proposé, 0 = offert. Ne constitue jamais une preuve de paiement.';
CREATE TABLE IF NOT EXISTS request_messages (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES service_requests(id),
  author_type varchar(20) NOT NULL CHECK (author_type IN ('customer','staff')),
  author_id integer NOT NULL,
  author_name varchar(160) NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_messages_request_idx ON request_messages(request_id,created_at);
CREATE TABLE IF NOT EXISTS request_events (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES service_requests(id),
  type varchar(40) NOT NULL,
  actor_name varchar(160) NOT NULL,
  body text NOT NULL,
  status varchar(40),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS request_events_request_idx ON request_events(request_id,created_at);
CREATE TABLE IF NOT EXISTS request_files (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES service_requests(id),
  filename varchar(160) NOT NULL,
  mime_type varchar(100) NOT NULL CHECK (mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png')),
  size integer NOT NULL CHECK (size BETWEEN 1 AND 3145728),
  kind varchar(20) NOT NULL CHECK (kind IN ('brief','delivery')),
  content bytea NOT NULL CHECK (octet_length(content)=size),
  uploaded_by_type varchar(20) NOT NULL CHECK (uploaded_by_type IN ('customer','staff')),
  uploaded_by_id integer NOT NULL,
  uploaded_by_name varchar(160) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'delivery' OR uploaded_by_type = 'staff')
);
CREATE INDEX IF NOT EXISTS request_files_request_idx ON request_files(request_id,created_at);
