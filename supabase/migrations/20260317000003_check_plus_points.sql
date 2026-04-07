-- Points balance for Check Plus check-ins
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS check_plus_points INTEGER NOT NULL DEFAULT 0;
