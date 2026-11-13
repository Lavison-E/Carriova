-- Premium pass (30 days, paid through GeniusPay) and the job-search assistant.
CREATE TABLE IF NOT EXISTS customer_premium_passes (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
  request_id integer UNIQUE REFERENCES service_requests(id) ON DELETE SET NULL,
  environment varchar(16) NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'sandbox')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS customer_premium_passes_customer_idx ON customer_premium_passes(customer_id, ends_at DESC);

CREATE TABLE IF NOT EXISTS premium_applications (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
  job_slug varchar(200),
  title varchar(200) NOT NULL,
  company varchar(200) NOT NULL DEFAULT '',
  location varchar(160) NOT NULL DEFAULT '',
  source_url varchar(1000),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 12000),
  status varchar(20) NOT NULL DEFAULT 'to_apply' CHECK (status IN ('to_apply', 'applied', 'interview', 'offer', 'rejected', 'archived')),
  match_score integer CHECK (match_score BETWEEN 0 AND 100),
  analysis jsonb,
  kit jsonb,
  kit_generated_at timestamptz,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 4000),
  applied_at timestamptz,
  follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS premium_applications_customer_idx ON premium_applications(customer_id, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS premium_applications_customer_job_idx ON premium_applications(customer_id, job_slug) WHERE job_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS premium_prep_plans (
  customer_id integer PRIMARY KEY REFERENCES customer_users(id) ON DELETE CASCADE,
  plan jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
