-- Dynamic admin-only Stock categories. Run after 20261122_shah_stock.sql.
-- The only seeded data is the three existing category labels; no product is modified.
BEGIN;

CREATE TABLE IF NOT EXISTS shah_stock_categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60 AND name = btrim(name) AND name !~ '[[:cntrl:]]')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_shah_stock_category_name ON shah_stock_categories (lower(name));

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'shah_stock_items'::regclass
      AND conname = 'fk_shah_stock_item_category'
  ) THEN
    INSERT INTO shah_stock_categories (id, name) VALUES
      ('soft-drinks', 'Soft drinks'), ('beer', 'Beer'), ('syrups', 'Syrups')
      ON CONFLICT (id) DO NOTHING;
    ALTER TABLE shah_stock_items DROP CONSTRAINT IF EXISTS shah_stock_items_category_check;
    ALTER TABLE shah_stock_items ADD CONSTRAINT fk_shah_stock_item_category
      FOREIGN KEY (category) REFERENCES shah_stock_categories (id) ON DELETE NO ACTION;
  END IF;
END
$migration$;

CREATE INDEX IF NOT EXISTS idx_shah_stock_item_category ON shah_stock_items (category);

-- Unknown categories are rejected by the foreign key. Lock both category rows to
-- serialize reclassification/removal with other writes; never delete a product.
CREATE OR REPLACE FUNCTION shah_remove_stock_category(source_id text, target_id text)
RETURNS text LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
BEGIN
  IF source_id = target_id THEN
    RETURN 'invalid_input';
  END IF;
  PERFORM id FROM shah_stock_categories
    WHERE id = source_id OR id = target_id
    ORDER BY id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM shah_stock_categories WHERE id = source_id) THEN
    RETURN 'category_not_found';
  END IF;
  IF target_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM shah_stock_categories WHERE id = target_id) THEN
    RETURN 'replacement_not_found';
  END IF;
  IF target_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM shah_stock_items WHERE category = source_id) THEN
      RETURN 'category_in_use';
    END IF;
  ELSE
    UPDATE shah_stock_items
      SET category = target_id, revision = revision + 1, updated_at = now()
      WHERE category = source_id;
  END IF;
  DELETE FROM shah_stock_categories WHERE id = source_id;
  RETURN 'removed';
END
$function$;

COMMIT;
