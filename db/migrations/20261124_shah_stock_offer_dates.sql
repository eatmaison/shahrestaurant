-- Preserve existing prices and counts; offer dates are optional.
BEGIN;
ALTER TABLE public.shah_stock_items
  ADD COLUMN IF NOT EXISTS purchase_offer_start date,
  ADD COLUMN IF NOT EXISTS purchase_offer_end date;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.shah_stock_items'::regclass
      AND conname = 'shah_stock_purchase_offer_dates_valid'
  ) THEN
    ALTER TABLE public.shah_stock_items ADD CONSTRAINT shah_stock_purchase_offer_dates_valid CHECK (
      (purchase_offer_start IS NULL OR (purchase_offer_cents IS NOT NULL AND purchase_offer_start BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'))
      AND (purchase_offer_end IS NULL OR (purchase_offer_cents IS NOT NULL AND purchase_offer_end BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'))
      AND (purchase_offer_start IS NULL OR purchase_offer_end IS NULL OR purchase_offer_start <= purchase_offer_end)
    );
  END IF;
END
$migration$;
COMMIT;
