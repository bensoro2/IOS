-- Allow multiple check-ins per category per day (limited by points instead)
ALTER TABLE public.check_plus_checkins DROP CONSTRAINT IF EXISTS unique_user_category_checkplus_daily;
