-- Optional private external product links. No backfill and no existing row updates.
BEGIN;

ALTER TABLE public.shah_stock_items ADD COLUMN IF NOT EXISTS sligro_url text
  CHECK (char_length(sligro_url) <= 512
    AND sligro_url ~ '^https://www[.]sligro[.]nl/p[.][0-9]{1,12}[.]html/[a-z0-9][-a-z0-9_]*[.]html$');

COMMIT;
