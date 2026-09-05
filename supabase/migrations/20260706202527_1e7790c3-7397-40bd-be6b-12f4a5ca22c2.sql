
-- Add star_coins column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS star_coins BIGINT NOT NULL DEFAULT 0;

-- Trigger: +1 star_coin on each activity_checkins insert
CREATE OR REPLACE FUNCTION public.award_star_coin_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET star_coins = star_coins + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_star_coin_on_checkin ON public.activity_checkins;
CREATE TRIGGER trg_award_star_coin_on_checkin
AFTER INSERT ON public.activity_checkins
FOR EACH ROW EXECUTE FUNCTION public.award_star_coin_on_checkin();

-- Update redeem_user_code: give owner +1 star_coin (instead of check_plus_points)
CREATE OR REPLACE FUNCTION public.redeem_user_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_redeemer_id UUID := auth.uid();
  v_owner RECORD;
BEGIN
  SELECT id, star_coins, user_code_use_count
  INTO v_owner
  FROM public.users
  WHERE user_code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF v_owner.id = v_redeemer_id THEN
    RETURN jsonb_build_object('error', 'self_redeem');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_code_redemptions
    WHERE redeemer_id = v_redeemer_id AND code_owner_id = v_owner.id
  ) THEN
    RETURN jsonb_build_object('error', 'already_redeemed');
  END IF;

  INSERT INTO public.user_code_redemptions (redeemer_id, code_owner_id)
  VALUES (v_redeemer_id, v_owner.id);

  UPDATE public.users
  SET star_coins = star_coins + 1,
      user_code_use_count = user_code_use_count + 1
  WHERE id = v_owner.id;

  RETURN jsonb_build_object('success', true);
END;
$$;
