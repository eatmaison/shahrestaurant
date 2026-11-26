BEGIN;
CREATE TABLE IF NOT EXISTS shah_taurus_stock_lines (
  business_day date NOT NULL,
  receipt text NOT NULL CHECK (receipt ~ '^[0-9]{6,22}$'),
  line integer NOT NULL CHECK (line BETWEEN 1 AND 99999),
  item_id uuid NOT NULL REFERENCES shah_stock_items(id),
  units integer NOT NULL CHECK (units BETWEEN 1 AND 10000),
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_day, receipt, line)
);
CREATE INDEX IF NOT EXISTS shah_taurus_stock_item_day_idx ON shah_taurus_stock_lines(item_id, business_day);

CREATE TABLE IF NOT EXISTS shah_taurus_stock_mappings (
  source_name text PRIMARY KEY CHECK (char_length(source_name) BETWEEN 1 AND 120),
  item_id uuid NOT NULL REFERENCES shah_stock_items(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Batch lock is scoped to Taurus import only. Stock locks also protect against normal count edits.
CREATE OR REPLACE FUNCTION shah_taurus_apply(payload jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  g record;
  s shah_stock_items%ROWTYPE;
  opened integer;
  imported integer := 0;
BEGIN
  IF jsonb_typeof(payload) <> 'array' OR jsonb_array_length(payload) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'invalid taurus batch' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer)
    GROUP BY v.day,v.receipt,v.line HAVING count(*) > 1) OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(payload) AS v(source_name text,id uuid)
    GROUP BY v.source_name HAVING count(DISTINCT v.id)>1)
  THEN RAISE EXCEPTION 'duplicate line or ambiguous mapping' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(174381220, 1);
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, qty integer)
    JOIN shah_taurus_stock_lines l ON (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line)
    WHERE l.item_id <> v.id OR l.units <> v.qty
  ) THEN RAISE EXCEPTION 'receipt already recorded differently' USING ERRCODE = '40001'; END IF;
  FOR g IN
    SELECT v.id, min(v.rev) AS rev, max(v.rev) AS max_rev, sum(v.qty)::integer AS qty, count(*)::integer AS n
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, rev integer, qty integer)
    WHERE NOT EXISTS (SELECT 1 FROM shah_taurus_stock_lines l WHERE (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line))
    GROUP BY v.id ORDER BY v.id
  LOOP
    SELECT * INTO s FROM shah_stock_items WHERE id=g.id FOR UPDATE;
    IF NOT FOUND OR s.archived_at IS NOT NULL OR s.revision <> g.rev OR g.rev <> g.max_rev OR s.total_units < g.qty THEN
      RAISE EXCEPTION 'stock changed or insufficient' USING ERRCODE = '40001';
    END IF;
    opened := CASE WHEN g.qty > s.loose_count AND s.case_size IS NOT NULL
      THEN (g.qty - s.loose_count + s.case_size - 1) / s.case_size ELSE 0 END;
    UPDATE shah_stock_items SET cases_count=s.cases_count-opened,
      loose_count=s.loose_count+opened*coalesce(s.case_size,0)-g.qty, revision=s.revision+1, updated_at=now()
      WHERE id=g.id;
    imported := imported + g.n;
  END LOOP;
  INSERT INTO shah_taurus_stock_mappings(source_name,item_id)
    SELECT DISTINCT v.source_name,v.id
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, source_name text, id uuid)
    WHERE NOT EXISTS (SELECT 1 FROM shah_taurus_stock_lines l WHERE (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line))
    ON CONFLICT(source_name) DO UPDATE SET item_id=excluded.item_id,updated_at=now();
  INSERT INTO shah_taurus_stock_lines(business_day,receipt,line,item_id,units)
    SELECT v.day,v.receipt,v.line,v.id,v.qty
    FROM jsonb_to_recordset(payload) AS v(day date, receipt text, line integer, id uuid, qty integer)
    ON CONFLICT (business_day,receipt,line) DO NOTHING;
  RETURN imported;
END;
$$;
COMMIT;
