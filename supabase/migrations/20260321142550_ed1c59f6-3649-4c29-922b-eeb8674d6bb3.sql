CREATE OR REPLACE FUNCTION public.validate_funding_direction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.direction NOT IN ('increase', 'decrease') THEN
    RAISE EXCEPTION 'direction must be increase or decrease';
  END IF;
  RETURN NEW;
END;
$$;