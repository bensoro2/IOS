-- Add hope_coins column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hope_coins bigint NOT NULL DEFAULT 0;

-- Function to spend hope coins on funding (atomic)
CREATE OR REPLACE FUNCTION public.spend_hope_coins_on_funding(
  _amount bigint,
  _direction text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _current_coins bigint;
  _current_pool bigint;
  _target bigint;
  _new_pool bigint;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF _direction NOT IN ('increase', 'decrease') THEN
    RETURN jsonb_build_object('error', 'invalid_direction');
  END IF;

  IF _amount < 1 THEN
    RETURN jsonb_build_object('error', 'invalid_amount');
  END IF;

  SELECT hope_coins INTO _current_coins FROM public.users WHERE id = _user_id FOR UPDATE;
  
  IF _current_coins < _amount THEN
    RETURN jsonb_build_object('error', 'insufficient_coins', 'balance', _current_coins);
  END IF;

  SELECT current_amount, target_amount INTO _current_pool, _target
    FROM public.funding_pool WHERE is_active = true FOR UPDATE;

  IF _direction = 'decrease' AND _amount > _current_pool THEN
    RETURN jsonb_build_object('error', 'exceeds_pool', 'pool', _current_pool);
  END IF;

  UPDATE public.users SET hope_coins = hope_coins - _amount WHERE id = _user_id;

  IF _direction = 'increase' THEN
    _new_pool := _current_pool + _amount;
  ELSE
    _new_pool := _current_pool - _amount;
  END IF;

  UPDATE public.funding_pool SET current_amount = _new_pool, updated_at = now() WHERE is_active = true;

  INSERT INTO public.funding_contributions (user_id, amount, direction, status)
  VALUES (_user_id, _amount, _direction, 'completed');

  IF _new_pool >= _target THEN
    PERFORM reset_all_checkins();
    RETURN jsonb_build_object('success', true, 'was_reset', true, 'current_amount', 0);
  END IF;

  RETURN jsonb_build_object('success', true, 'current_amount', _new_pool, 'coins_remaining', _current_coins - _amount);
END;
$$;