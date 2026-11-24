-- Optional private purchase costs. No backfill and no existing row updates.
BEGIN;

ALTER TABLE public.shah_stock_items
  ADD COLUMN IF NOT EXISTS purchase_pack_units integer CHECK (purchase_pack_units BETWEEN 1 AND 1000),
  ADD COLUMN IF NOT EXISTS purchase_regular_cents integer CHECK (purchase_regular_cents BETWEEN 1 AND 9999999),
  ADD COLUMN IF NOT EXISTS purchase_offer_cents integer CHECK (purchase_offer_cents BETWEEN 0 AND 9999999);

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.shah_stock_items'::regclass
        AND conname = 'shah_stock_purchase_price_valid'
  ) THEN
    ALTER TABLE public.shah_stock_items ADD CONSTRAINT shah_stock_purchase_price_valid CHECK (
      (purchase_regular_cents IS NULL AND purchase_pack_units IS NULL AND purchase_offer_cents IS NULL)
      OR (purchase_regular_cents IS NOT NULL AND purchase_pack_units IS NOT NULL
        AND (purchase_offer_cents IS NULL OR purchase_offer_cents < purchase_regular_cents))
    );
  END IF;
END
$migration$;

COMMIT;
