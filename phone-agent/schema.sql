-- Additive migration. The existing shared reservations table remains authoritative.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';
CREATE TABLE IF NOT EXISTS phone_agent_calls (
  call_id text PRIMARY KEY,
  webhook_id text NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'starting',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE IF NOT EXISTS phone_agent_bookings (
  call_id text PRIMARY KEY REFERENCES phone_agent_calls(call_id),
  reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS phone_agent_orders (
  call_id text PRIMARY KEY REFERENCES phone_agent_calls(call_id),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS phone_agent_days (
  date text PRIMARY KEY CHECK (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  capacity integer NOT NULL CHECK (capacity BETWEEN 0 AND 35),
  external_guests integer NOT NULL DEFAULT 0 CHECK (external_guests BETWEEN 0 AND 1000),
  limit_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS phone_agent_email_outbox (
  reservation_id uuid PRIMARY KEY REFERENCES reservations(id) ON DELETE CASCADE,
  lang text NOT NULL CHECK (lang IN ('nl','en')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
