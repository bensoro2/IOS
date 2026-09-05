-- =========================================================
-- 1) PROTECT SENSITIVE COLUMNS ON public.users
-- =========================================================
CREATE OR REPLACE FUNCTION public.protect_user_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Privileged contexts: service role, superuser, SECURITY DEFINER RPCs (owned by postgres)
  IF current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.star_coins := 0;
    NEW.hope_coins := 0;
    NEW.check_plus_points := 0;
    NEW.user_code_use_count := 0;
    NEW.role := 'user';
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.star_coins IS DISTINCT FROM OLD.star_coins
     OR NEW.hope_coins IS DISTINCT FROM OLD.hope_coins
     OR NEW.check_plus_points IS DISTINCT FROM OLD.check_plus_points
     OR NEW.user_code IS DISTINCT FROM OLD.user_code
     OR NEW.user_code_use_count IS DISTINCT FROM OLD.user_code_use_count
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'ไม่อนุญาตให้แก้ไขข้อมูลนี้โดยตรง';
  END IF;

  -- status may only toggle between active/suspended by the owner
  IF NEW.status IS DISTINCT FROM OLD.status
     AND (NEW.status IS NULL OR NEW.status NOT IN ('active', 'suspended')) THEN
    RAISE EXCEPTION 'สถานะบัญชีไม่ถูกต้อง';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_sensitive_columns ON public.users;
CREATE TRIGGER trg_protect_user_sensitive_columns
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_sensitive_columns();

-- =========================================================
-- 2) HIDE PII COLUMNS (email / phone / birthday) FROM CLIENTS
-- =========================================================
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT SELECT (
  id, display_name, avatar_url, role, status, last_login, created_at,
  bio, theme, theme_custom, avatar_activity, user_code, user_code_use_count,
  check_plus_points, hope_coins, star_coins
) ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE(email text, phone text, birthday date)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email, u.phone, u.birthday
  FROM public.users u
  WHERE u.id = auth.uid();
$$;

-- =========================================================
-- 3) PREMIUM STATUS & SUBSCRIPTION HISTORY: SERVER-ONLY WRITES
-- =========================================================
DROP POLICY IF EXISTS "Users can insert their own premium status" ON public.user_premium;
DROP POLICY IF EXISTS "Users can update their own premium status" ON public.user_premium;
REVOKE INSERT, UPDATE, DELETE ON public.user_premium FROM anon, authenticated;
GRANT SELECT ON public.user_premium TO authenticated;
GRANT ALL ON public.user_premium TO service_role;

DROP POLICY IF EXISTS "Users insert own subscription history" ON public.subscription_history;
REVOKE INSERT, UPDATE, DELETE ON public.subscription_history FROM anon, authenticated;
GRANT SELECT ON public.subscription_history TO authenticated;
GRANT ALL ON public.subscription_history TO service_role;

-- =========================================================
-- 4) PROMO CODES: NOT LISTABLE BY USERS
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;
REVOKE ALL ON public.promo_codes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.promo_codes FROM authenticated;
GRANT SELECT ON public.promo_codes TO authenticated; -- still gated by admin-only RLS policy
GRANT INSERT, UPDATE ON public.promo_codes TO authenticated; -- admin-only RLS policies apply
GRANT ALL ON public.promo_codes TO service_role;

-- =========================================================
-- 5) CHECK-INS: SERVER-VALIDATED RPCs ONLY
-- =========================================================
DROP POLICY IF EXISTS "Users can create own check-ins" ON public.activity_checkins;
DROP POLICY IF EXISTS "Users can create own fast check-ins" ON public.fast_checkins;
DROP POLICY IF EXISTS "Users can insert own check_plus checkins" ON public.check_plus_checkins;

REVOKE INSERT, UPDATE, DELETE ON public.activity_checkins FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fast_checkins FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.check_plus_checkins FROM anon, authenticated;
GRANT ALL ON public.activity_checkins TO service_role;
GRANT ALL ON public.fast_checkins TO service_role;
GRANT ALL ON public.check_plus_checkins TO service_role;

-- Activity (group chat) check-in: must be a member, once per day, no duplicate category
CREATE OR REPLACE FUNCTION public.perform_activity_checkin(_group_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  _category text;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  IF NOT public.is_group_member(_group_chat_id, _uid) THEN
    RETURN jsonb_build_object('error','not_member');
  END IF;

  SELECT a.category INTO _category
  FROM public.activity_group_chats g
  JOIN public.activities a ON a.id = g.activity_id
  WHERE g.id = _group_chat_id;

  IF EXISTS (
    SELECT 1 FROM public.activity_checkins
    WHERE user_id = _uid AND checked_in_at = _today
  ) THEN
    RETURN jsonb_build_object('error','already_checked_in');
  END IF;

  IF _category IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.fast_checkins
    WHERE user_id = _uid AND checked_in_at = _today AND category = _category
  ) THEN
    RETURN jsonb_build_object('error','category_already_checked_in');
  END IF;

  INSERT INTO public.activity_checkins (user_id, group_chat_id, checked_in_at, category)
  VALUES (_uid, _group_chat_id, _today, _category);

  RETURN jsonb_build_object('success', true, 'category', _category);
END;
$$;

-- Fast check-in: Pro/Gold only, max 2 per day, no duplicate category
CREATE OR REPLACE FUNCTION public.perform_fast_checkin(_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  _used int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF _category IS NULL OR length(trim(_category)) = 0 THEN
    RETURN jsonb_build_object('error','invalid_category');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_premium
    WHERE user_id = _uid
      AND premium_until > now()
      AND plan_type IN ('pro','gold')
  ) THEN
    RETURN jsonb_build_object('error','premium_required');
  END IF;

  SELECT count(*) INTO _used
  FROM public.fast_checkins
  WHERE user_id = _uid AND checked_in_at = _today;

  IF _used >= 2 THEN
    RETURN jsonb_build_object('error','daily_limit_reached');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.fast_checkins
    WHERE user_id = _uid AND checked_in_at = _today AND category = _category
  ) OR EXISTS (
    SELECT 1 FROM public.activity_checkins
    WHERE user_id = _uid AND checked_in_at = _today AND category = _category
  ) THEN
    RETURN jsonb_build_object('error','category_already_checked_in');
  END IF;

  INSERT INTO public.fast_checkins (user_id, category, checked_in_at)
  VALUES (_uid, _category, _today);

  RETURN jsonb_build_object('success', true, 'remaining', 1 - _used);
END;
$$;

-- Check Plus check-in: consumes one point atomically
CREATE OR REPLACE FUNCTION public.perform_check_plus_checkin(_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  _points int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF _category IS NULL OR length(trim(_category)) = 0 THEN
    RETURN jsonb_build_object('error','invalid_category');
  END IF;

  SELECT check_plus_points INTO _points FROM public.users WHERE id = _uid FOR UPDATE;
  IF COALESCE(_points, 0) <= 0 THEN
    RETURN jsonb_build_object('error','not_enough_points');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.check_plus_checkins
    WHERE user_id = _uid AND checked_in_at = _today AND category = _category
  ) THEN
    RETURN jsonb_build_object('error','category_already_checked_in');
  END IF;

  INSERT INTO public.check_plus_checkins (user_id, category, code_id, checked_in_at)
  VALUES (_uid, _category, NULL, _today);

  UPDATE public.users SET check_plus_points = check_plus_points - 1 WHERE id = _uid;

  RETURN jsonb_build_object('success', true, 'points_left', _points - 1);
END;
$$;