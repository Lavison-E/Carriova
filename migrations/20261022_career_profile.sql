-- Additive migration: existing accounts keep access without a WhatsApp number.
ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS whatsapp varchar(16);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_users_whatsapp_e164' AND conrelid = 'customer_users'::regclass) THEN
    ALTER TABLE customer_users ADD CONSTRAINT customer_users_whatsapp_e164 CHECK (whatsapp IS NULL OR whatsapp ~ '^\+[1-9][0-9]{7,14}$');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS customer_career_profiles (
  customer_id integer PRIMARY KEY REFERENCES customer_users(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
