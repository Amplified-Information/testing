-- Remove trigger
DROP TRIGGER IF EXISTS create_weekly_partition
ON price_history;

-- Remove function
DROP FUNCTION IF EXISTS ensure_weekly_partition();

-- Drop all partitions
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT inhrelid::regclass AS partition_name
        FROM pg_inherits
        WHERE inhparent = 'price_history'::regclass
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || rec.partition_name || ' CASCADE';
    END LOOP;
END$$;

-- Drop parent table
DROP TABLE IF EXISTS price_history CASCADE;
