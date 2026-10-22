-- Additive workflow extension. Transaction and lock are supplied by the migration runner.
-- Existing delivered/completed requests and all historical publication events are retained.
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_status_check CHECK (
  status IN ('received','reviewing','quoted','in_progress','awaiting_validation','finalized','delivered','revision_requested','completed','cancelled')
);
ALTER TABLE request_files DROP CONSTRAINT IF EXISTS request_files_kind_check;
ALTER TABLE request_files ADD CONSTRAINT request_files_kind_check CHECK (kind IN ('brief','review','delivery'));
ALTER TABLE request_files DROP CONSTRAINT IF EXISTS request_files_check;
ALTER TABLE request_files DROP CONSTRAINT IF EXISTS request_files_staff_prepared_check;
ALTER TABLE request_files ADD CONSTRAINT request_files_staff_prepared_check CHECK (kind='brief' OR uploaded_by_type='staff');
COMMENT ON COLUMN request_files.kind IS 'brief: pièces initiales ; review: version de travail visible après awaiting_validation ; delivery: fichier final visible après delivered. Les publications antérieures restent accessibles.';
ALTER TABLE workspace_notifications DROP CONSTRAINT IF EXISTS workspace_notifications_kind_check;
ALTER TABLE workspace_notifications ADD CONSTRAINT workspace_notifications_kind_check CHECK (
  kind IN ('welcome','created','quoted','awaiting_validation','finalized','quote_rejected','delivered','revision_requested','in_progress','completed','cancelled','message')
);
CREATE OR REPLACE FUNCTION queue_workspace_event_mail() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id integer; recipient text;
BEGIN
  IF NEW.type NOT IN ('created','quoted','awaiting_validation','finalized','quote_rejected','delivered','revision_requested','in_progress','completed','cancelled') THEN RETURN NEW; END IF;
  SELECT customer_id INTO owner_id FROM service_requests WHERE id=NEW.request_id;
  IF NEW.type='created' THEN
    FOREACH recipient IN ARRAY ARRAY['customer','team'] LOOP
      INSERT INTO workspace_notifications(customer_id,request_id,event_id,dedupe_key,kind,audience)
      VALUES(owner_id,NEW.request_id,NEW.id,'workspace:event:'||NEW.id||':'||recipient,NEW.type,recipient)
      ON CONFLICT(dedupe_key) DO NOTHING;
    END LOOP;
  ELSE
    recipient := CASE WHEN NEW.type IN ('quoted','awaiting_validation','delivered','cancelled') THEN 'customer' ELSE 'team' END;
    INSERT INTO workspace_notifications(customer_id,request_id,event_id,dedupe_key,kind,audience)
    VALUES(owner_id,NEW.request_id,NEW.id,'workspace:event:'||NEW.id||':'||recipient,NEW.type,recipient)
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
