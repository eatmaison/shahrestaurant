-- =============================================================================
-- Restaurant group (Eat to go / The Maison / ...) - Neon (PostgreSQL) schema
-- ONE shared database for all sister websites. This file is documentation;
-- the app creates/upgrades the schema automatically and idempotently on boot
-- (see app/lib/db.ts - CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS),
-- so running it is optional and never deletes data.
--   psql "$DATABASE_URL" -f db/schema.sql
-- or paste it into the Neon Console SQL Editor.
-- =============================================================================

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------ users
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  -- Bcrypt/argon hash - never store plaintext passwords.
  password_hash text        NOT NULL,
  phone         text,
  -- Last used delivery details, auto-filled on the customer's next order.
  address       text,
  postcode      text,
  role          text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points        integer     NOT NULL DEFAULT 0,
  order_count   integer     NOT NULL DEFAULT 0,
  is_vip        boolean     NOT NULL DEFAULT false,
  account_type  text        NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'company')),
  btw           text,
  kvk           text,
  -- Last activity on the site (updated while signed in).
  last_seen_at  timestamptz,
  last_seen_site text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ------------------------------------------------------------------ visitor_sessions
-- Anonymous (not-signed-in) visitors, tracked by a browser cookie id so the
-- admin "Recently online" panel can show active guests next to signed-in users.
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id             text        PRIMARY KEY,
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_site text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  visit_count    integer     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_seen ON visitor_sessions (last_seen_at);

-- ------------------------------------------------------------------ products
CREATE TABLE IF NOT EXISTS products (
  id                   text        PRIMARY KEY,
  -- Brand id from the admin-managed brands table.
  brand                text        NOT NULL,
  -- Same product sold at several restaurants shares a group id (create/edit once).
  group_id             text,
  category             text        NOT NULL,
  subcategory          text        NOT NULL DEFAULT '',
  name                 text        NOT NULL,
  description          text        NOT NULL DEFAULT '',
  description_nl       text        NOT NULL DEFAULT '',
  price                numeric(10, 2) NOT NULL,
  image                text,
  -- { "en": "...", "nl": "..." } for the "Read more" popup
  detailed_description jsonb,
  ingredients          text[]      NOT NULL DEFAULT '{}',
  ingredients_nl       text[]      NOT NULL DEFAULT '{}',
  allergens            text[]      NOT NULL DEFAULT '{}',
  allergens_nl         text[]      NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_group ON products (group_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products (subcategory);

-- ------------------------------------------------------------------ orders
CREATE TABLE IF NOT EXISTS orders (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Human-readable sequential number (shown as ETG-1001, ETG-1002, ...)
  order_number integer     GENERATED ALWAYS AS IDENTITY (START WITH 1001),
  user_id      uuid        REFERENCES users (id) ON DELETE SET NULL,
  customer_name text       NOT NULL,
  address      text        NOT NULL,
  postcode     text        NOT NULL DEFAULT '',
  phone        text        NOT NULL,
  subtotal     numeric(10, 2) NOT NULL,
  discount     numeric(10, 2) NOT NULL DEFAULT 0,
  points_used  integer     NOT NULL DEFAULT 0,
  points_earned integer    NOT NULL DEFAULT 0,
  delivery     numeric(10, 2) NOT NULL DEFAULT 0,
  total        numeric(10, 2) NOT NULL,
  status       text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'delivery', 'delivered')),
  paid         boolean     NOT NULL DEFAULT false,
  customer_effects_applied boolean NOT NULL DEFAULT true,
  account_type text        NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'company')),
  invoice_sent boolean     NOT NULL DEFAULT false,
  note         text,
  -- Company scheduled delivery: { "type": "once|workdays", "date": "YYYY-MM-DD", "time": "HH:mm" }
  schedule     jsonb,
  -- How the customer receives the order: delivered to their address or self-pickup.
  fulfillment  text        NOT NULL DEFAULT 'delivery' CHECK (fulfillment IN ('delivery', 'pickup')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ------------------------------------------------------------------ order_items
CREATE TABLE IF NOT EXISTS order_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id text        NOT NULL,
  name       text        NOT NULL,
  price      numeric(10, 2) NOT NULL,
  qty        integer     NOT NULL CHECK (qty > 0),
  brand      text        NOT NULL,
  category   text        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- ------------------------------------------------------------------ payments
-- Mollie payment records. Online food orders are inserted before payment so
-- failed/cancelled/expired attempts stay visible to admins and support.
CREATE TABLE IF NOT EXISTS payments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mollie_payment_id text        UNIQUE,
  kind              text        NOT NULL CHECK (kind IN ('order', 'vip')),
  user_id           uuid        REFERENCES users (id) ON DELETE SET NULL,
  order_id          uuid        REFERENCES orders (id) ON DELETE SET NULL,
  amount            numeric(10, 2) NOT NULL,
  status            text        NOT NULL DEFAULT 'open',
  failure_reason    text,
  payload           jsonb,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_mollie ON payments (mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);

-- ------------------------------------------------------------------ brands
-- Admin-managed restaurants and their menu categories.
-- categories: ordered jsonb array of { "name": "Wraps", "icon": "burger" }.
CREATE TABLE IF NOT EXISTS brands (
  id         text        PRIMARY KEY,
  name       text        NOT NULL,
  logo       text        NOT NULL DEFAULT '',
  sort       integer     NOT NULL DEFAULT 0,
  categories jsonb       NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------ reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES users (id) ON DELETE SET NULL,
  user_name  text        NOT NULL,
  rating     integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       text        NOT NULL DEFAULT '',
  -- Which website the review was written on ('eattogo', 'themaison', ...).
  -- Each site's homepage shows only its own reviews.
  site       text        NOT NULL DEFAULT 'eattogo',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_site ON reviews (site);

-- ------------------------------------------------------------------ vip_requests
CREATE TABLE IF NOT EXISTS vip_requests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_name  text        NOT NULL,
  -- Uploaded VIP card photo. For production, store a URL to object storage
  -- (e.g. Vercel Blob / S3) rather than a base64 data URL.
  image      text        NOT NULL,
  status     text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_requests_status ON vip_requests (status);

-- ------------------------------------------------------------------ social_links
-- Admin-managed social media links shown in the footer when enabled.
CREATE TABLE IF NOT EXISTS social_links (
  platform   text        PRIMARY KEY,
  url        text        NOT NULL DEFAULT '',
  enabled    boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------ reservations
-- The Maison table reservations (shared database across the restaurant group).
CREATE TABLE IF NOT EXISTS reservations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Human-readable sequential number (shown as RSV-501, RSV-502, ...)
  reservation_number integer     GENERATED ALWAYS AS IDENTITY (START WITH 501),
  user_id            uuid        REFERENCES users (id) ON DELETE SET NULL,
  guest_name         text        NOT NULL,
  email              text        NOT NULL DEFAULT '',
  phone              text        NOT NULL,
  -- Reservation calendar date (YYYY-MM-DD) and arrival time (HH:mm).
  date               text        NOT NULL,
  time               text        NOT NULL,
  guests             integer     NOT NULL CHECK (guests BETWEEN 1 AND 40),
  -- Optional occasion: birthday, business, romantic, family, other.
  occasion           text        NOT NULL DEFAULT '',
  note               text,
  status             text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  -- Which website the reservation was made on ('themaison', ...).
  site               text        NOT NULL DEFAULT 'themaison',
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations (user_id);

-- ------------------------------------------------------------------ gallery_images
-- Admin-managed photos shown on the public /events/gallery page. The image
-- files themselves live in DigitalOcean Spaces (shared bucket for the whole
-- restaurant group); only the public URL is stored here. Each site keeps its
-- own rows via the `site` column ('themaison', 'tandoor', ...).
CREATE TABLE IF NOT EXISTS gallery_images (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site       text        NOT NULL,
  url        text        NOT NULL,
  alt        text        NOT NULL DEFAULT '',
  alt_nl     text        NOT NULL DEFAULT '',
  -- Category key shown as a badge: 'dishes' | 'interior' | 'bar' | 'ambiance'.
  category   text        NOT NULL DEFAULT '',
  -- True for tall (portrait) photos in the masonry layout.
  portrait   boolean     NOT NULL DEFAULT false,
  sort       integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_site ON gallery_images (site);
