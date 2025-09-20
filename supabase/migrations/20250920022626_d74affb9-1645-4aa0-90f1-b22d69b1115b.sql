-- Remove timeout testing specific database components
DROP TABLE IF EXISTS public.hcs_system_health;
DROP FUNCTION IF EXISTS public.trigger_hcs_cleanup_monitor();