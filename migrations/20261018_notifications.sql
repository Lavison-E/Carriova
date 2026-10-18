-- Transaction supplied by the migration runner. Only future events enqueue email.
CREATE TABLE IF NOT EXISTS workspace_notifications (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customer_users(id),
  request_id integer REFERENCES service_requests(id),
  event_id integer REFERENCES request_events(id),
  message_id integer REFERENCES request_messages(id),
  dedupe_key varchar(120) NOT NULL,
  kind varchar(40) NOT NULL CHECK (kind IN ('welcome','created','quoted','delivered','revision_requested','in_progress','completed','cancelled','message')),
  audience varchar(20) NOT NULL CHECK (audience IN ('customer','team')),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent')),
  payload jsonb,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  lease_token varchar(36),
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  last_error varchar(80),
  provider_id varchar(128),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind='welcome' AND request_id IS NULL AND event_id IS NULL AND message_id IS NULL)
    OR (kind<>'welcome' AND request_id IS NOT NULL AND ((event_id IS NOT NULL)::integer + (message_id IS NOT NULL)::integer)=1))
);
CREATE UNIQUE INDEX IF NOT EXISTS workspace_notifications_dedupe_idx ON workspace_notifications(dedupe_key);
CREATE INDEX IF NOT EXISTS workspace_notifications_pending_idx ON workspace_notifications(status,available_at);
CREATE INDEX IF NOT EXISTS workspace_notifications_customer_idx ON workspace_notifications(customer_id);
COMMENT ON TABLE workspace_notifications IS 'Outbox transactionnelle : aucun texte de message client, nom de fichier ou contenu joint. Le payload ne contient que les destinataires et une notification générique avec lien authentifié.';

CREATE OR REPLACE FUNCTION queue_workspace_event_mail() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id integer; recipient text;
BEGIN
  IF NEW.type NOT IN ('created','quoted','delivered','revision_requested','in_progress','completed','cancelled') THEN RETURN NEW; END IF;
  SELECT customer_id INTO owner_id FROM service_requests WHERE id=NEW.request_id;
  IF NEW.type='created' THEN
    FOREACH recipient IN ARRAY ARRAY['customer','team'] LOOP
      INSERT INTO workspace_notifications(customer_id,request_id,event_id,dedupe_key,kind,audience)
      VALUES(owner_id,NEW.request_id,NEW.id,'workspace:event:'||NEW.id||':'||recipient,NEW.type,recipient)
      ON CONFLICT(dedupe_key) DO NOTHING;
    END LOOP;
  ELSE
    recipient := CASE WHEN NEW.type IN ('quoted','delivered','cancelled') THEN 'customer' ELSE 'team' END;
    INSERT INTO workspace_notifications(customer_id,request_id,event_id,dedupe_key,kind,audience)
    VALUES(owner_id,NEW.request_id,NEW.id,'workspace:event:'||NEW.id||':'||recipient,NEW.type,recipient)
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION queue_workspace_message_mail() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id integer; recipient text;
BEGIN
  SELECT customer_id INTO owner_id FROM service_requests WHERE id=NEW.request_id;
  recipient := CASE WHEN NEW.author_type='customer' THEN 'team' ELSE 'customer' END;
  INSERT INTO workspace_notifications(customer_id,request_id,message_id,dedupe_key,kind,audience)
  VALUES(owner_id,NEW.request_id,NEW.id,'workspace:message:'||NEW.id||':'||recipient,'message',recipient)
  ON CONFLICT(dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION queue_workspace_welcome_mail() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO workspace_notifications(customer_id,dedupe_key,kind,audience)
  VALUES(NEW.id,'workspace:customer:'||NEW.id||':welcome','welcome','customer')
  ON CONFLICT(dedupe_key) DO NOTHING;
  RETURN NEW;
END;
$$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='workspace_event_mail' AND tgrelid='request_events'::regclass) THEN
    CREATE TRIGGER workspace_event_mail AFTER INSERT ON request_events FOR EACH ROW EXECUTE FUNCTION queue_workspace_event_mail();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='workspace_message_mail' AND tgrelid='request_messages'::regclass) THEN
    CREATE TRIGGER workspace_message_mail AFTER INSERT ON request_messages FOR EACH ROW EXECUTE FUNCTION queue_workspace_message_mail();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='workspace_welcome_mail' AND tgrelid='customer_users'::regclass) THEN
    CREATE TRIGGER workspace_welcome_mail AFTER INSERT ON customer_users FOR EACH ROW EXECUTE FUNCTION queue_workspace_welcome_mail();
  END IF;
END $$;
