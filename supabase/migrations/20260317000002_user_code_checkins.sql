-- Allow check_plus_checkins to not require a code_id (for user code check-ins)
ALTER TABLE public.check_plus_checkins ALTER COLUMN code_id DROP NOT NULL;

-- Track how many times each user's code has been used
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_code_use_count INTEGER NOT NULL DEFAULT 0;
