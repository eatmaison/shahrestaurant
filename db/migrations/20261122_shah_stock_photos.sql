-- Internal Stock thumbnails only. Does not update inventory rows or counts.
BEGIN;
CREATE TABLE IF NOT EXISTS public.shah_stock_photos (
  stock_item_id uuid PRIMARY KEY REFERENCES public.shah_stock_items(id) ON DELETE CASCADE,
  version uuid NOT NULL DEFAULT gen_random_uuid(),
  image_webp bytea NOT NULL CHECK (octet_length(image_webp) BETWEEN 1 AND 131072)
);
COMMIT;
