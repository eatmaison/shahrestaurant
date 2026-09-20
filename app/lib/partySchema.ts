export const PARTY_DDL = [
  `CREATE TABLE IF NOT EXISTS party_migrations (site text NOT NULL, name text NOT NULL, PRIMARY KEY(site,name))`,
  `CREATE TABLE IF NOT EXISTS party_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    event_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    price_cents integer NOT NULL CHECK (price_cents BETWEEN 100 AND 100000),
    capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 10000),
    tickets_sold integer NOT NULL DEFAULT 0 CHECK (tickets_sold >= 0 AND tickets_sold <= capacity),
    image text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','cancelled')),
    published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(site, slug)
  )`,
  `CREATE TABLE IF NOT EXISTS party_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES party_events(id),
    access_token_hash text NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    price_cents integer NOT NULL CHECK (price_cents > 0),
    total_cents integer GENERATED ALWAYS AS (quantity * price_cents) STORED,
    event_title text NOT NULL,
    event_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    mollie_payment_id text UNIQUE,
    payment_status text NOT NULL DEFAULT 'open',
    ticket_status text NOT NULL DEFAULT 'pending' CHECK (ticket_status IN ('pending','confirmed','refund_pending','refunded','failed')),
    refund_id text,
    email_sent_at timestamptz,
    email_claimed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ticket_status <> 'confirmed' OR payment_status = 'paid')
  )`,
  `CREATE INDEX IF NOT EXISTS party_bookings_event ON party_bookings(event_id, created_at DESC)`,
  `CREATE OR REPLACE FUNCTION party_capacity_guard() RETURNS trigger AS $$
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.event_id <> OLD.event_id OR NEW.quantity <> OLD.quantity OR NEW.price_cents <> OLD.price_cents THEN
        RAISE EXCEPTION 'Booking quantities and prices are immutable';
      END IF;
      IF OLD.ticket_status = 'confirmed' AND NEW.ticket_status <> 'confirmed' THEN
        UPDATE party_events SET tickets_sold = tickets_sold - OLD.quantity, updated_at = now() WHERE id = OLD.event_id;
      END IF;
      IF OLD.ticket_status = 'confirmed' OR NEW.ticket_status <> 'confirmed' THEN RETURN NEW; END IF;
    END IF;
    IF NEW.ticket_status = 'confirmed' THEN
      IF NEW.payment_status <> 'paid' THEN RAISE EXCEPTION 'Payment required'; END IF;
      UPDATE party_events SET tickets_sold = tickets_sold + NEW.quantity, updated_at = now()
        WHERE id = NEW.event_id AND tickets_sold + NEW.quantity <= capacity AND status <> 'cancelled';
      IF NOT FOUND THEN NEW.ticket_status := 'refund_pending'; END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,
  `CREATE OR REPLACE TRIGGER party_capacity_guard BEFORE INSERT OR UPDATE ON party_bookings
    FOR EACH ROW EXECUTE FUNCTION party_capacity_guard()`,
  `CREATE OR REPLACE FUNCTION party_prevent_booking_delete() RETURNS trigger AS $$
  BEGIN RAISE EXCEPTION 'Party bookings are retained for payment audit'; END;
  $$ LANGUAGE plpgsql`,
  `CREATE OR REPLACE TRIGGER party_booking_audit BEFORE DELETE ON party_bookings
    FOR EACH ROW EXECUTE FUNCTION party_prevent_booking_delete()`,
];