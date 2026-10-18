-- Migration additive : le schéma historique (dont leads) doit déjà exister.
-- Ne crée aucun prospect de démonstration et ne modifie aucune donnée existante.
-- Le runner applique cette migration dans sa transaction globale.
DO $$ BEGIN
  IF to_regclass('leads') IS NULL THEN
    RAISE EXCEPTION 'La table leads doit exister avant la migration CRM.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS lead_qualifications (
  lead_id integer PRIMARY KEY REFERENCES leads(id),
  country varchar(40) NOT NULL,
  profile varchar(40) NOT NULL,
  discovery_source varchar(40) NOT NULL,
  need varchar(40) NOT NULL,
  cv_status varchar(40) NOT NULL,
  timeline varchar(40) NOT NULL,
  target_offer varchar(40),
  difficulty varchar(40),
  budget varchar(40) NOT NULL,
  payment_readiness varchar(40) NOT NULL,
  contact_whatsapp boolean NOT NULL,
  consent_version varchar(40) NOT NULL,
  privacy_notice text NOT NULL,
  source_form varchar(80) NOT NULL DEFAULT '/qualification',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE lead_qualifications IS 'Réponses du formulaire public. leads.email vide signifie que le formulaire ne recueille pas d’adresse e-mail.';
CREATE INDEX IF NOT EXISTS lead_qualifications_need_idx ON lead_qualifications(need);

CREATE TABLE IF NOT EXISTS crm_lead_state (
  lead_id integer PRIMARY KEY REFERENCES leads(id),
  status varchar(40) NOT NULL DEFAULT 'new' CHECK (status IN ('new','to_qualify','hot','qualified','proposal_sent','negotiating','client','lost','nurture')),
  priority varchar(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  follow_up_at timestamptz,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_lead_state_status_idx ON crm_lead_state(status);
CREATE INDEX IF NOT EXISTS crm_lead_state_follow_up_idx ON crm_lead_state(follow_up_at);
CREATE INDEX IF NOT EXISTS leads_created_at_id_idx ON leads(created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS crm_history (
  id serial PRIMARY KEY,
  lead_id integer NOT NULL REFERENCES leads(id),
  action varchar(40) NOT NULL,
  actor_id integer,
  actor_name varchar(160),
  note text,
  previous_status varchar(40),
  status varchar(40),
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_history_lead_idx ON crm_history(lead_id, created_at);
-- L’identité affichée est conservée même après désactivation d’un conseiller.
-- Aucune voie de modification/suppression de l’historique n’est autorisée.
CREATE OR REPLACE FUNCTION crm_history_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'L’historique CRM est immuable.';
END;
$$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'crm_history_append_only_guard' AND tgrelid = 'crm_history'::regclass) THEN
    CREATE TRIGGER crm_history_append_only_guard BEFORE UPDATE OR DELETE OR TRUNCATE ON crm_history
      FOR EACH STATEMENT EXECUTE FUNCTION crm_history_append_only();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS crm_submission_limits (
  key varchar(80) PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count integer NOT NULL CHECK (count > 0)
);
CREATE INDEX IF NOT EXISTS crm_submission_limits_window_start_idx ON crm_submission_limits(window_start);
