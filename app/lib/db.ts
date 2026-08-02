import { neon } from "@neondatabase/serverless";
import { DEFAULT_BRAND_CONFIGS, PIZZA_SUBCATEGORIES } from "./data";
import type { BrandCategory } from "./types";

/**
 * Neon (PostgreSQL) client. Uses the serverless HTTP driver, which works both
 * locally and on serverless hosts. Import this only from server code.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
}

export const sql = neon(process.env.DATABASE_URL);

/** DDL statements, run once and idempotent (mirrors db/schema.sql). */
const DDL: string[] = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    phone text,
    address text,
    postcode text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    points integer NOT NULL DEFAULT 0,
    order_count integer NOT NULL DEFAULT 0,
    is_vip boolean NOT NULL DEFAULT false,
    account_type text NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','company')),
    btw text,
    kvk text,
    email_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Add saved delivery fields to databases created before they existed.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS address text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS postcode text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false`,
  // Last activity on the site (updated on every bootstrap while signed in).
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_site text`,
  // Anonymous (not-signed-in) visitors, tracked by a browser cookie id so the
  // admin can see how many guests are currently active alongside signed-in users.
  `CREATE TABLE IF NOT EXISTS visitor_sessions (
    id text PRIMARY KEY,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_site text,
    created_at timestamptz NOT NULL DEFAULT now(),
    visit_count integer NOT NULL DEFAULT 1
  )`,
  `ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()`,
  `ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS visit_count integer NOT NULL DEFAULT 1`,
  `CREATE INDEX IF NOT EXISTS idx_visitor_sessions_seen ON visitor_sessions (last_seen_at)`,
  // Admin-managed social media links shown in the footer when enabled.
  `CREATE TABLE IF NOT EXISTS social_links (
    platform text PRIMARY KEY,
    url text NOT NULL DEFAULT '',
    enabled boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS restaurant_open_overrides (
    site text PRIMARY KEY,
    mode text NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto','open','closed')),
    local_date text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    brand text NOT NULL,
    category text NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    price numeric(10,2) NOT NULL,
    image text,
    sort_order integer NOT NULL DEFAULT 0,
    detailed_description jsonb,
    ingredients text[] NOT NULL DEFAULT '{}',
    allergens text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Dutch product content for databases created before bilingual menus existed.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS description_nl text NOT NULL DEFAULT ''`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text NOT NULL DEFAULT ''`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_nl text[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens_nl text[] NOT NULL DEFAULT '{}'`,
  // The same product sold at several restaurants shares a group id, so it can be
  // created and edited once for all of them from any admin panel.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS group_id text`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer`,
  `UPDATE products
     SET sort_order = ranked.sort_order
    FROM (
      SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) - 1 AS sort_order
      FROM products
    ) ranked
    WHERE products.id = ranked.id AND products.sort_order IS NULL`,
  `ALTER TABLE products ALTER COLUMN sort_order SET DEFAULT 0`,
  `ALTER TABLE products ALTER COLUMN sort_order SET NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_products_group ON products (group_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order)`,
  `CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number integer GENERATED ALWAYS AS IDENTITY (START WITH 1001),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    customer_name text NOT NULL,
    address text NOT NULL,
    postcode text NOT NULL DEFAULT '',
    phone text NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    discount numeric(10,2) NOT NULL DEFAULT 0,
    points_used integer NOT NULL DEFAULT 0,
    points_earned integer NOT NULL DEFAULT 0,
    delivery numeric(10,2) NOT NULL DEFAULT 0,
    total numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','preparing','delivery','delivered')),
    paid boolean NOT NULL DEFAULT false,
    account_type text NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal','company')),
    invoice_sent boolean NOT NULL DEFAULT false,
    customer_effects_applied boolean NOT NULL DEFAULT true,
    note text,
    schedule jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)`,
  // Delivery vs. self-pickup choice for databases created before it existed.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment text NOT NULL DEFAULT 'delivery' CHECK (fulfillment IN ('delivery','pickup'))`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_effects_applied boolean NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    qty integer NOT NULL CHECK (qty > 0),
    brand text NOT NULL,
    category text NOT NULL DEFAULT '',
    side_choice text,
    side_label text
  )`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS side_choice text`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS side_label text`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (order_id)
  )`,
  `CREATE TABLE IF NOT EXISTS vip_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    image text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mollie_payment_id text UNIQUE,
    kind text NOT NULL CHECK (kind IN ('order','vip')),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    amount numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'open',
    failure_reason text,
    payload jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`,
  `CREATE INDEX IF NOT EXISTS idx_payments_mollie ON payments (mollie_payment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id)`,
  `CREATE TABLE IF NOT EXISTS app_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Admin-managed restaurants/brands and their menu categories (with icon keys).
  `CREATE TABLE IF NOT EXISTS brands (
    id text PRIMARY KEY,
    name text NOT NULL,
    logo text NOT NULL DEFAULT '',
    sort integer NOT NULL DEFAULT 0,
    categories jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Databases created from the original schema constrained brand to the two
  // built-in restaurants; brands are admin-managed now, so drop those checks.
  `ALTER TABLE products DROP CONSTRAINT IF EXISTS products_brand_check`,
  `ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_brand_check`,
  // The Maison table reservations (shared database with the group's sites).
  `CREATE TABLE IF NOT EXISTS reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_number integer GENERATED ALWAYS AS IDENTITY (START WITH 501),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    guest_name text NOT NULL,
    email text NOT NULL DEFAULT '',
    phone text NOT NULL,
    date text NOT NULL,
    time text NOT NULL,
    guests integer NOT NULL CHECK (guests BETWEEN 1 AND 40),
    occasion text NOT NULL DEFAULT '',
    note text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined','cancelled')),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date)`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations (user_id)`,
  // Which website a review was written on (shared DB across the restaurant
  // group). Existing/legacy rows and the eattogo site default to 'eattogo';
  // this site inserts its own SITE_ID explicitly.
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS site text NOT NULL DEFAULT 'eattogo'`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_site ON reviews (site)`,
  // Which website a reservation was made on (future sites may take bookings too).
  `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS site text NOT NULL DEFAULT 'themaison'`,
  // The Maison accepts reviews from both orders (eattogo) and reservations
  // (themaison). A review is tied to one of them, never both.
  `ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_reservation_unique ON reviews (reservation_id) WHERE reservation_id IS NOT NULL`,
  // Admin-managed gallery photos (files live in DigitalOcean Spaces; only the
  // public URL is stored). Shared table - each site keeps its own rows via `site`.
  `CREATE TABLE IF NOT EXISTS gallery_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site text NOT NULL,
    url text NOT NULL,
    alt text NOT NULL DEFAULT '',
    alt_nl text NOT NULL DEFAULT '',
    category text NOT NULL DEFAULT '',
    portrait boolean NOT NULL DEFAULT false,
    sort integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gallery_images_site ON gallery_images (site)`,
];

let readyPromise: Promise<void> | null = null;

/**
 * Lazily create the schema and seed the product catalogue on first use.
 * Safe to call on every request - the underlying work runs only once per process.
 */
export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      for (const stmt of DDL) {
        await sql.query(stmt);
      }
      await seedProducts();
      await seedBrands();
      await seedPizzaSubcategories();
    })().catch((err) => {
      // Reset so a later request can retry after a transient failure.
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

async function seedPizzaSubcategories(): Promise<void> {
  const migrationId = "20260720_pizza_subcategories";
  const done = (await sql.query(`SELECT 1 FROM app_migrations WHERE id = $1`, [migrationId])) as unknown[];
  if (done.length > 0) return;

  const rows = (await sql.query(`SELECT id, categories FROM brands`)) as { id: string; categories: BrandCategory[] }[];
  for (const row of rows) {
    let changed = false;
    const categories = row.categories.map((category) => {
      if (category.name !== "Pizzas") return category;
      const subcategories = [...(category.subcategories ?? [])];
      const existing = new Set(subcategories.map((sub) => sub.name.toLowerCase()));
      for (const name of PIZZA_SUBCATEGORIES) {
        if (existing.has(name.toLowerCase())) continue;
        subcategories.push({ name, icon: "pizza" });
        changed = true;
      }
      return { ...category, subcategories };
    });
    if (changed) {
      await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [row.id, JSON.stringify(categories)]);
    }
  }

  await sql.query(`UPDATE products SET subcategory = $1 WHERE category = $2 AND coalesce(subcategory, '') = ''`, [
    PIZZA_SUBCATEGORIES[0],
    "Pizzas",
  ]);
  await sql.query(`INSERT INTO app_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [migrationId]);
}

/** Product catalogue is now admin-managed in the database.
 * The initial bootstrap only ensures the built-in brands exist; product rows
 * are created through the authenticated admin flow instead of a hardcoded
 * in-repo seed list.
 */
async function seedProducts(): Promise<void> {
  const rows = (await sql.query(`SELECT count(*)::int AS n FROM products`)) as { n: number }[];
  if (rows[0]?.n > 0) return;

  // Intentionally no-op: the product catalogue is dynamically managed in DB.
}

/** Insert the built-in restaurants (with their categories) if the brands table is empty. */
async function seedBrands(): Promise<void> {
  const rows = (await sql.query(`SELECT count(*)::int AS n FROM brands`)) as { n: number }[];
  if (rows[0]?.n > 0) return;

  for (const [i, b] of DEFAULT_BRAND_CONFIGS.entries()) {
    await sql.query(
      `INSERT INTO brands (id, name, logo, sort, categories) VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [b.id, b.name, b.logo, i, JSON.stringify(b.categories)]
    );
  }
}
