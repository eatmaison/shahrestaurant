-- OPTIONAL analytics storage. Apply explicitly after a database backup/review.
-- Application startup never runs this migration. No historical source is backfilled.
BEGIN;
CREATE TABLE IF NOT EXISTS visitor_observations (
  site text NOT NULL,
  visitor_id text NOT NULL,
  subject_key text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source jsonb NOT NULL,
  classification text NOT NULL CHECK (classification IN ('possible-automation','interaction-reported','unknown')),
  reasons text[] NOT NULL DEFAULT '{}',
  first_observed_at timestamptz NOT NULL DEFAULT now(),
  last_observed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  last_path text NOT NULL,
  PRIMARY KEY (site,visitor_id,subject_key),
  CHECK (length(visitor_id) <= 64 AND length(subject_key) <= 64),
  CHECK (length(last_path) <= 128 AND cardinality(reasons) <= 4)
);
CREATE INDEX IF NOT EXISTS idx_visitor_observations_user ON visitor_observations(site,user_id,last_observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_observations_expiry ON visitor_observations(expires_at);
COMMIT;

-- For an idle installation, schedule this statement daily using the deployment's
-- existing database maintenance job. Writes/admin reads also prune expired rows.
-- DELETE FROM visitor_observations WHERE expires_at <= now();
