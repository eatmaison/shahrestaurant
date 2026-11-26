BEGIN;
ALTER TABLE shah_stock_items ADD COLUMN IF NOT EXISTS keg jsonb;
DO $constraint$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='shah_stock_items'::regclass AND conname='shah_stock_keg_valid') THEN
    ALTER TABLE shah_stock_items ADD CONSTRAINT shah_stock_keg_valid CHECK (keg IS NULL OR COALESCE((
      jsonb_typeof(keg)='object' AND cases_count=0 AND case_size IS NULL AND loose_count=0
      AND jsonb_typeof(keg->'capacityMl')='number' AND (keg->>'capacityMl') ~ '^[0-9]+$'
      AND jsonb_typeof(keg->'sealed')='number' AND (keg->>'sealed') ~ '^[0-9]+$'
      AND jsonb_typeof(keg->'openMl')='number' AND (keg->>'openMl') ~ '^[0-9]+$'
      AND (keg->>'capacityMl')::numeric BETWEEN 1000 AND 100000
      AND (keg->>'sealed')::numeric BETWEEN 0 AND 10000
      AND (keg->>'openMl')::numeric BETWEEN 0 AND (keg->>'capacityMl')::numeric
    ),false));
  END IF;
END;
$constraint$;
ALTER TABLE shah_taurus_stock_mappings ADD COLUMN IF NOT EXISTS pour_ml integer CHECK (pour_ml BETWEEN 1 AND 100000);
ALTER TABLE shah_taurus_stock_lines ADD COLUMN IF NOT EXISTS deducted_ml bigint CHECK (deducted_ml BETWEEN 1 AND 1000000000);

CREATE OR REPLACE FUNCTION shah_taurus_apply(payload jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  g record;
  s shah_stock_items%ROWTYPE;
  opened integer;
  imported integer := 0;
  capacity integer;
  available_open integer;
  consumed bigint;
BEGIN
  IF jsonb_typeof(payload) <> 'array' OR jsonb_array_length(payload) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'invalid taurus batch' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer)
    GROUP BY v.day,v.receipt,v.line HAVING count(*) > 1) OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(payload) AS v(source_name text,id uuid,pour_ml integer)
    GROUP BY v.source_name HAVING count(DISTINCT (v.id,v.pour_ml))>1)
  THEN RAISE EXCEPTION 'duplicate line or ambiguous mapping' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(174381220, 1);
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, qty integer, pour_ml integer)
    JOIN shah_taurus_stock_lines l ON (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line)
    WHERE l.item_id <> v.id OR l.units <> v.qty
  ) THEN RAISE EXCEPTION 'receipt already recorded differently' USING ERRCODE = '40001'; END IF;
  FOR g IN
    SELECT v.id, min(v.rev) AS rev, max(v.rev) AS max_rev, sum(v.qty)::integer AS qty, count(*)::integer AS n,
      coalesce(sum(v.qty::bigint*v.pour_ml),0) AS volume, count(v.pour_ml) AS sized,
      min(v.pour_ml) AS min_pour, max(v.pour_ml) AS max_pour
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, rev integer, qty integer, pour_ml integer)
    WHERE NOT EXISTS (SELECT 1 FROM shah_taurus_stock_lines l WHERE (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line))
    GROUP BY v.id ORDER BY v.id
  LOOP
    SELECT * INTO s FROM shah_stock_items WHERE id=g.id FOR UPDATE;
    IF NOT FOUND OR s.archived_at IS NOT NULL OR s.revision <> g.rev OR g.rev <> g.max_rev THEN
      RAISE EXCEPTION 'stock changed or insufficient' USING ERRCODE = '40001';
    END IF;
    IF s.keg IS NOT NULL THEN
      capacity := (s.keg->>'capacityMl')::integer;
      available_open := (s.keg->>'openMl')::integer;
      consumed := g.volume;
      IF g.sized<>g.n OR g.min_pour<1 OR g.max_pour>capacity OR
          (s.keg->>'sealed')::bigint*capacity+available_open<consumed THEN
        RAISE EXCEPTION 'invalid or insufficient keg volume' USING ERRCODE='40001';
      END IF;
      opened := CASE WHEN consumed>available_open THEN (consumed-available_open+capacity-1)/capacity ELSE 0 END;
      UPDATE shah_stock_items SET keg=jsonb_build_object('capacityMl',capacity,
        'sealed',(s.keg->>'sealed')::integer-opened,
        'openMl',available_open+opened::bigint*capacity-consumed),
        revision=s.revision+1,updated_at=now() WHERE id=g.id;
    ELSE
      IF g.sized<>0 OR s.total_units<g.qty THEN
        RAISE EXCEPTION 'invalid or insufficient unit stock' USING ERRCODE='40001';
      END IF;
      opened := CASE WHEN g.qty > s.loose_count AND s.case_size IS NOT NULL
      THEN (g.qty - s.loose_count + s.case_size - 1) / s.case_size ELSE 0 END;
    UPDATE shah_stock_items SET cases_count=s.cases_count-opened,
      loose_count=s.loose_count+opened*coalesce(s.case_size,0)-g.qty, revision=s.revision+1, updated_at=now()
      WHERE id=g.id;
    END IF;
    imported := imported + g.n;
  END LOOP;
  INSERT INTO shah_taurus_stock_mappings(source_name,item_id,pour_ml)
    SELECT DISTINCT v.source_name,v.id,v.pour_ml
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, source_name text, id uuid, pour_ml integer)
    WHERE NOT EXISTS (SELECT 1 FROM shah_taurus_stock_lines l WHERE (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line))
    ON CONFLICT(source_name) DO UPDATE SET item_id=excluded.item_id,pour_ml=excluded.pour_ml,updated_at=now();
  INSERT INTO shah_taurus_stock_lines(business_day,receipt,line,item_id,units,deducted_ml)
    SELECT v.day,v.receipt,v.line,v.id,v.qty,v.qty::bigint*v.pour_ml
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, qty integer, pour_ml integer)
    ON CONFLICT (business_day,receipt,line) DO NOTHING;
  RETURN imported;
END;
$$;
COMMIT;
