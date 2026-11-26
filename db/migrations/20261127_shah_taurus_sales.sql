BEGIN;
CREATE TABLE IF NOT EXISTS shah_taurus_sale_lines (
  business_day date NOT NULL,
  receipt text NOT NULL CHECK (receipt ~ '^[0-9]{6,22}$'),
  line integer NOT NULL CHECK (line BETWEEN 1 AND 99999999),
  item_name text NOT NULL CHECK (char_length(item_name) BETWEEN 1 AND 120),
  sale_group text NOT NULL CHECK (char_length(sale_group) <= 120),
  qty integer NOT NULL CHECK (qty BETWEEN -10000 AND 10000),
  cents integer NOT NULL CHECK (cents BETWEEN -100000000 AND 100000000),
  adjustment boolean NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_day, receipt, line)
);

CREATE OR REPLACE FUNCTION shah_taurus_apply_sales(sales jsonb, stock jsonb)
RETURNS TABLE(sale_lines integer, stock_lines integer)
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  pending jsonb;
BEGIN
  IF jsonb_typeof(sales) IS DISTINCT FROM 'array' OR jsonb_array_length(sales) NOT BETWEEN 1 AND 2000
     OR jsonb_typeof(stock) IS DISTINCT FROM 'array' OR jsonb_array_length(stock) > 2000 THEN
    RAISE EXCEPTION 'invalid settlement batch' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(174381220, 1);
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(sales) AS v(day date, receipt text, line integer,
      name text, "group" text, qty integer, cents integer, adjustment boolean)
    JOIN shah_taurus_sale_lines l ON (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line)
    WHERE (l.item_name,l.sale_group,l.qty,l.cents,l.adjustment)
      IS DISTINCT FROM (v.name,v."group",v.qty,v.cents,v.adjustment)
  ) THEN RAISE EXCEPTION 'settlement line already recorded differently' USING ERRCODE='40001'; END IF;

  -- Confirming a different alias for new lines never moves already-debited units.
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(stock) s(x)
    JOIN shah_taurus_stock_lines l
      ON (l.business_day,l.receipt,l.line)=((s.x->>'day')::date,s.x->>'receipt',(s.x->>'line')::integer)
    WHERE l.units IS DISTINCT FROM (s.x->>'qty')::integer
  ) THEN RAISE EXCEPTION 'stock receipt quantity changed' USING ERRCODE='40001'; END IF;
  SELECT coalesce(jsonb_agg(s.x),'[]'::jsonb) INTO pending
    FROM jsonb_array_elements(stock) s(x)
    WHERE NOT EXISTS (SELECT 1 FROM shah_taurus_stock_lines l
      WHERE (l.business_day,l.receipt,l.line)=((s.x->>'day')::date,s.x->>'receipt',(s.x->>'line')::integer));
  stock_lines := CASE WHEN jsonb_array_length(pending)>0 THEN shah_taurus_apply(pending) ELSE 0 END;
  INSERT INTO shah_taurus_sale_lines(business_day,receipt,line,item_name,sale_group,qty,cents,adjustment)
    SELECT v.day,v.receipt,v.line,v.name,v."group",v.qty,v.cents,v.adjustment
    FROM jsonb_to_recordset(sales) AS v(day date, receipt text, line integer,
      name text, "group" text, qty integer, cents integer, adjustment boolean)
    ON CONFLICT(business_day,receipt,line) DO NOTHING;
  GET DIAGNOSTICS sale_lines=ROW_COUNT;
  RETURN NEXT;
END;
$$;
COMMIT;
