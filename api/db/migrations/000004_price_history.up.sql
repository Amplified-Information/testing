-- ===========================================
-- 1. Parent Partitioned Table
-- ===========================================
CREATE TABLE price_history (
    market_id UUID NOT NULL,
    price NUMERIC(18,10) NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (market_id, ts)
) PARTITION BY RANGE (ts);


-- ===========================================
-- 2. Create the current ISO week partition
-- ===========================================
DO $$
DECLARE
    week_start date := date_trunc('week', now())::date;
    week_end   date := (date_trunc('week', now()) + interval '7 days')::date;
    part_name  text := 'price_history_' ||
                       to_char(week_start, 'IYYY') || 'w' ||
                       to_char(week_start, 'IW');
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_history
         FOR VALUES FROM (%L) TO (%L);',
        part_name, week_start, week_end
    );

    -- main query index
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I_mid_ts_idx
         ON %I (market_id, ts DESC);',
        part_name || '_mid_ts', part_name
    );

    -- global time scan index
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I_ts_idx
         ON %I (ts DESC);',
        part_name || '_ts', part_name
    );
END$$;


-- ===========================================
-- 3. Auto-create weekly partitions w/ indexes
-- ===========================================
CREATE OR REPLACE FUNCTION ensure_weekly_partition()
RETURNS TRIGGER AS $$
DECLARE
    week_start date;
    week_end   date;
    year_week  text;
    part_name  text;
BEGIN
    week_start := date_trunc('week', NEW.ts)::date;
    week_end   := (week_start + interval '7 days')::date;

    year_week := to_char(week_start, 'IYYY') || 'w' || to_char(week_start, 'IW');
    part_name := 'price_history_' || year_week;

    -- Check if partition exists
    PERFORM 1 FROM pg_class WHERE relname = part_name;
    IF NOT FOUND THEN
        -- create partition
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF price_history
             FOR VALUES FROM (%L) TO (%L);',
            part_name, week_start, week_end
        );

        -- Index: (market_id, ts DESC)
        EXECUTE format(
            'CREATE INDEX %I ON %I (market_id, ts DESC);',
            part_name || '_mid_ts_idx', part_name
        );

        -- Index: (ts DESC)
        EXECUTE format(
            'CREATE INDEX %I ON %I (ts DESC);',
            part_name || '_ts_idx', part_name
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ===========================================
-- 4. Trigger for automatic weekly partitions
-- ===========================================
CREATE TRIGGER create_weekly_partition
BEFORE INSERT ON price_history
FOR EACH ROW
EXECUTE FUNCTION ensure_weekly_partition();
