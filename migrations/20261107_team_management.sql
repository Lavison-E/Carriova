ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS staff_team_audit (
  id serial PRIMARY KEY,
  actor_id integer NOT NULL,
  target_id integer NOT NULL,
  actor_name varchar(120) NOT NULL,
  target_name varchar(120) NOT NULL,
  action varchar(40) NOT NULL,
  details text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_team_audit_created_idx ON staff_team_audit(created_at);
CREATE INDEX IF NOT EXISTS staff_team_audit_target_idx ON staff_team_audit(target_id, created_at);
CREATE INDEX IF NOT EXISTS staff_team_audit_actor_idx ON staff_team_audit(actor_id, created_at);
