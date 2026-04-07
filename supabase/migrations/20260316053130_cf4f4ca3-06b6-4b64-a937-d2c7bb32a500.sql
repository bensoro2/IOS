CREATE OR REPLACE FUNCTION public.increment_reel_views(_reel_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE reels SET views_count = views_count + 1 WHERE id = _reel_id;
$$;