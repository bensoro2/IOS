-- Function to redeem a user code: gives +1 check_plus_points to the code owner
-- Runs with SECURITY DEFINER so it can update any user's row
CREATE OR REPLACE FUNCTION redeem_user_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redeemer_id UUID := auth.uid();
  v_owner RECORD;
BEGIN
  -- Find owner
  SELECT id, check_plus_points, user_code_use_count
  INTO v_owner
  FROM public.users
  WHERE user_code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF v_owner.id = v_redeemer_id THEN
    RETURN jsonb_build_object('error', 'self_redeem');
  END IF;

  -- Check duplicate redemption
  IF EXISTS (
    SELECT 1 FROM public.user_code_redemptions
    WHERE redeemer_id = v_redeemer_id AND code_owner_id = v_owner.id
  ) THEN
    RETURN jsonb_build_object('error', 'already_redeemed');
  END IF;

  -- Record redemption
  INSERT INTO public.user_code_redemptions (redeemer_id, code_owner_id)
  VALUES (v_redeemer_id, v_owner.id);

  -- Give +1 point to the owner
  UPDATE public.users
  SET
    check_plus_points = check_plus_points + 1,
    user_code_use_count = user_code_use_count + 1
  WHERE id = v_owner.id;

  RETURN jsonb_build_object('success', true);
END;
$$;
