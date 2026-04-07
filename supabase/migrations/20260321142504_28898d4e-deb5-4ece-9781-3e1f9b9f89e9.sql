-- Create funding pool table
CREATE TABLE public.funding_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_amount bigint NOT NULL DEFAULT 0,
  target_amount bigint NOT NULL DEFAULT 10000000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view funding pool" ON public.funding_pool
  FOR SELECT TO public USING (true);

INSERT INTO public.funding_pool (target_amount) VALUES (10000000);

CREATE TABLE public.funding_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount bigint NOT NULL,
  direction text NOT NULL DEFAULT 'increase',
  stripe_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contributions" ON public.funding_contributions
  FOR SELECT TO public USING (true);

CREATE OR REPLACE FUNCTION public.validate_funding_direction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.direction NOT IN ('increase', 'decrease') THEN
    RAISE EXCEPTION 'direction must be increase or decrease';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_funding_direction_trigger
  BEFORE INSERT OR UPDATE ON public.funding_contributions
  FOR EACH ROW EXECUTE FUNCTION public.validate_funding_direction();

CREATE OR REPLACE FUNCTION public.reset_all_checkins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_checkins;
  DELETE FROM public.fast_checkins;
  DELETE FROM public.check_plus_checkins;
  UPDATE public.funding_pool SET current_amount = 0, updated_at = now() WHERE is_active = true;
END;
$$;