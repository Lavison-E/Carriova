-- Preserve the offer selected when a lead or customer request was submitted.
-- Nullable for historical/custom requests. Quoted and paid amounts are independent.
ALTER TABLE lead_qualifications ADD COLUMN IF NOT EXISTS offer_snapshot jsonb;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS offer_snapshot jsonb;
