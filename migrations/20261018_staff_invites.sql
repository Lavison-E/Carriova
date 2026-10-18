-- Invitations opérateur : aucun compte actif ni donnée existante n’est modifié.
CREATE TABLE IF NOT EXISTS staff_invites (
 token_hash varchar(64) PRIMARY KEY,
 user_id integer NOT NULL UNIQUE REFERENCES staff_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_invites_expiry_idx ON staff_invites(expires_at);
