
CREATE TABLE public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  duration text,
  days_added int NOT NULL,
  price bigint,
  source text NOT NULL,
  premium_until_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.subscription_history TO authenticated;
GRANT ALL ON public.subscription_history TO service_role;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscription history"
  ON public.subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_subscription_history_user_created ON public.subscription_history (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.redeem_subscription_with_coins(_plan text, _duration text, _currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _price bigint;
  _days int;
  _balance bigint;
  _current_until timestamptz;
  _new_until timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('error','not_authenticated');
  END IF;
  IF _plan NOT IN ('pro','gold') THEN
    RETURN jsonb_build_object('error','invalid_plan');
  END IF;
  IF _duration NOT IN ('1month','3months','6months') THEN
    RETURN jsonb_build_object('error','invalid_duration');
  END IF;
  IF _currency NOT IN ('level','star') THEN
    RETURN jsonb_build_object('error','invalid_currency');
  END IF;

  _price := CASE
    WHEN _currency='level' AND _plan='pro'  AND _duration='1month'  THEN 500
    WHEN _currency='level' AND _plan='pro'  AND _duration='3months' THEN 1350
    WHEN _currency='level' AND _plan='pro'  AND _duration='6months' THEN 3495
    WHEN _currency='level' AND _plan='gold' AND _duration='1month'  THEN 1000
    WHEN _currency='level' AND _plan='gold' AND _duration='3months' THEN 2700
    WHEN _currency='level' AND _plan='gold' AND _duration='6months' THEN 7450
    WHEN _currency='star'  AND _plan='pro'  AND _duration='1month'  THEN 150
    WHEN _currency='star'  AND _plan='pro'  AND _duration='3months' THEN 400
    WHEN _currency='star'  AND _plan='pro'  AND _duration='6months' THEN 900
    WHEN _currency='star'  AND _plan='gold' AND _duration='1month'  THEN 300
    WHEN _currency='star'  AND _plan='gold' AND _duration='3months' THEN 800
    WHEN _currency='star'  AND _plan='gold' AND _duration='6months' THEN 1800
  END;

  _days := CASE _duration
    WHEN '1month' THEN 30
    WHEN '3months' THEN 90
    WHEN '6months' THEN 180
  END;

  IF _currency = 'level' THEN
    SELECT hope_coins INTO _balance FROM public.users WHERE id = _uid FOR UPDATE;
  ELSE
    SELECT star_coins INTO _balance FROM public.users WHERE id = _uid FOR UPDATE;
  END IF;

  IF _balance IS NULL OR _balance < _price THEN
    RETURN jsonb_build_object('error','insufficient_balance','required',_price,'balance',COALESCE(_balance,0));
  END IF;

  IF _currency = 'level' THEN
    UPDATE public.users SET hope_coins = hope_coins - _price WHERE id = _uid;
  ELSE
    UPDATE public.users SET star_coins = star_coins - _price WHERE id = _uid;
  END IF;

  SELECT premium_until INTO _current_until FROM public.user_premium WHERE user_id = _uid FOR UPDATE;

  IF _current_until IS NULL OR _current_until < now() THEN
    _new_until := now() + (_days || ' days')::interval;
  ELSE
    _new_until := _current_until + (_days || ' days')::interval;
  END IF;

  INSERT INTO public.user_premium (user_id, plan_type, premium_until)
  VALUES (_uid, _plan, _new_until)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_type = EXCLUDED.plan_type,
        premium_until = EXCLUDED.premium_until,
        updated_at = now();

  INSERT INTO public.subscription_history
    (user_id, plan_type, duration, days_added, price, source, premium_until_after)
  VALUES
    (_uid, _plan, _duration, _days, _price,
     CASE WHEN _currency='level' THEN 'level_coin' ELSE 'star_coin' END,
     _new_until);

  RETURN jsonb_build_object(
    'success', true,
    'plan', _plan,
    'premium_until', _new_until,
    'coins_spent', _price,
    'currency', _currency,
    'balance_remaining', _balance - _price
  );
END;
$function$;
