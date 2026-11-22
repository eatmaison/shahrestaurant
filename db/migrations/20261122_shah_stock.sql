-- Shah restaurant's internal inventory. Apply this additive migration deliberately.
-- This schema contains no live stock data. Authorized operators seed it separately, if needed.
BEGIN;

CREATE TABLE IF NOT EXISTS shah_stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_key text UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100 AND name = btrim(name)),
  category text NOT NULL CHECK (category IN ('soft-drinks', 'beer', 'syrups')),
  cases_count integer NOT NULL DEFAULT 0 CHECK (cases_count BETWEEN 0 AND 1000000),
  case_size integer CHECK (case_size BETWEEN 1 AND 1000),
  loose_count integer NOT NULL DEFAULT 0 CHECK (loose_count BETWEEN 0 AND 1000000),
  total_units integer GENERATED ALWAYS AS (cases_count * coalesce(case_size, 0) + loose_count) STORED,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  archived_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cases_count = 0 OR case_size IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shah_stock_active_name
  ON shah_stock_items (category, lower(name)) WHERE archived_at IS NULL;

COMMIT;
