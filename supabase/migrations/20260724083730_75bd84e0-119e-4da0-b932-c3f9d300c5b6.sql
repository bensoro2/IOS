
-- 1. duo_pairs
CREATE TABLE public.duo_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT duo_pairs_ordered CHECK (user_a < user_b),
  CONSTRAINT duo_pairs_unique UNIQUE (user_a, user_b)
);
CREATE INDEX duo_pairs_user_a_idx ON public.duo_pairs(user_a);
CREATE INDEX duo_pairs_user_b_idx ON public.duo_pairs(user_b);

GRANT SELECT ON public.duo_pairs TO authenticated;
GRANT ALL ON public.duo_pairs TO service_role;
ALTER TABLE public.duo_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_pairs_read_own" ON public.duo_pairs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 2. duo_requests
CREATE TABLE public.duo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT duo_requests_no_self CHECK (from_user <> to_user),
  CONSTRAINT duo_requests_status_valid CHECK (status IN ('pending','accepted','rejected','cancelled'))
);
CREATE UNIQUE INDEX duo_requests_pending_unique
  ON public.duo_requests(from_user, to_user) WHERE status = 'pending';
CREATE INDEX duo_requests_to_user_idx ON public.duo_requests(to_user);
CREATE INDEX duo_requests_from_user_idx ON public.duo_requests(from_user);

GRANT SELECT ON public.duo_requests TO authenticated;
GRANT ALL ON public.duo_requests TO service_role;
ALTER TABLE public.duo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_requests_read_own" ON public.duo_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- 3. duo_cooldowns
CREATE TABLE public.duo_cooldowns (
  user_id uuid PRIMARY KEY,
  available_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.duo_cooldowns TO authenticated;
GRANT ALL ON public.duo_cooldowns TO service_role;
ALTER TABLE public.duo_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duo_cooldowns_read_own" ON public.duo_cooldowns
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Extend notifications type check (drop existing check if any, add duo types)
DO $$
DECLARE c_name text;
BEGIN
  SELECT conname INTO c_name FROM pg_constraint
   WHERE conrelid = 'public.notifications'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%type%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

-- Helper: does user have an active duo?
CREATE OR REPLACE FUNCTION public.has_active_duo(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.duo_pairs
    WHERE user_a = _user_id OR user_b = _user_id
  );
$$;

-- Get duo partner id for a user (null if none)
CREATE OR REPLACE FUNCTION public.get_duo_partner(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE WHEN user_a = _user_id THEN user_b ELSE user_a END
  FROM public.duo_pairs
  WHERE user_a = _user_id OR user_b = _user_id
  LIMIT 1;
$$;

-- RPC: send request
CREATE OR REPLACE FUNCTION public.send_duo_request(_target uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cool timestamptz;
  _req_id uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  IF _uid = _target THEN RETURN jsonb_build_object('error','self'); END IF;

  IF public.has_active_duo(_uid) THEN
    RETURN jsonb_build_object('error','already_in_duo');
  END IF;
  IF public.has_active_duo(_target) THEN
    RETURN jsonb_build_object('error','target_in_duo');
  END IF;

  SELECT available_at INTO _cool FROM public.duo_cooldowns WHERE user_id = _uid;
  IF _cool IS NOT NULL AND _cool > now() THEN
    RETURN jsonb_build_object('error','cooldown','available_at',_cool);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.duo_requests
    WHERE status='pending'
      AND ((from_user=_uid AND to_user=_target) OR (from_user=_target AND to_user=_uid))
  ) THEN
    RETURN jsonb_build_object('error','pending_exists');
  END IF;

  INSERT INTO public.duo_requests(from_user, to_user)
  VALUES (_uid, _target) RETURNING id INTO _req_id;

  INSERT INTO public.notifications(user_id, actor_id, type)
  VALUES (_target, _uid, 'duo_request');

  RETURN jsonb_build_object('success', true, 'request_id', _req_id);
END;
$$;

-- RPC: respond
CREATE OR REPLACE FUNCTION public.respond_duo_request(_request_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _req record;
  _a uuid; _b uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT * INTO _req FROM public.duo_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF _req.to_user <> _uid THEN RETURN jsonb_build_object('error','not_authorized'); END IF;
  IF _req.status <> 'pending' THEN RETURN jsonb_build_object('error','not_pending'); END IF;

  IF _accept THEN
    IF public.has_active_duo(_req.from_user) OR public.has_active_duo(_req.to_user) THEN
      UPDATE public.duo_requests SET status='cancelled', responded_at=now() WHERE id=_request_id;
      RETURN jsonb_build_object('error','already_in_duo');
    END IF;

    IF _req.from_user < _req.to_user THEN _a := _req.from_user; _b := _req.to_user;
    ELSE _a := _req.to_user; _b := _req.from_user; END IF;

    INSERT INTO public.duo_pairs(user_a, user_b) VALUES (_a, _b);

    UPDATE public.duo_requests SET status='accepted', responded_at=now() WHERE id=_request_id;

    -- Cancel any other pending requests involving either user
    UPDATE public.duo_requests
       SET status='cancelled', responded_at=now()
     WHERE status='pending'
       AND id <> _request_id
       AND (from_user IN (_a,_b) OR to_user IN (_a,_b));

    INSERT INTO public.notifications(user_id, actor_id, type)
    VALUES (_req.from_user, _uid, 'duo_accepted');

    RETURN jsonb_build_object('success', true, 'accepted', true);
  ELSE
    UPDATE public.duo_requests SET status='rejected', responded_at=now() WHERE id=_request_id;
    INSERT INTO public.notifications(user_id, actor_id, type)
    VALUES (_req.from_user, _uid, 'duo_rejected');
    RETURN jsonb_build_object('success', true, 'accepted', false);
  END IF;
END;
$$;

-- RPC: cancel duo
CREATE OR REPLACE FUNCTION public.cancel_duo()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _partner uuid;
  _cool_at timestamptz := now() + interval '3 days';
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT public.get_duo_partner(_uid) INTO _partner;
  IF _partner IS NULL THEN RETURN jsonb_build_object('error','no_duo'); END IF;

  DELETE FROM public.duo_pairs
   WHERE (user_a=_uid AND user_b=_partner) OR (user_a=_partner AND user_b=_uid);

  INSERT INTO public.duo_cooldowns(user_id, available_at)
  VALUES (_uid, _cool_at), (_partner, _cool_at)
  ON CONFLICT (user_id) DO UPDATE SET available_at = EXCLUDED.available_at, created_at = now();

  INSERT INTO public.notifications(user_id, actor_id, type)
  VALUES (_partner, _uid, 'duo_cancelled');

  RETURN jsonb_build_object('success', true, 'cooldown_until', _cool_at);
END;
$$;

-- RPC: cancel my own pending outgoing request
CREATE OR REPLACE FUNCTION public.cancel_duo_request(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _req record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;
  SELECT * INTO _req FROM public.duo_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF _req.from_user <> _uid THEN RETURN jsonb_build_object('error','not_authorized'); END IF;
  IF _req.status <> 'pending' THEN RETURN jsonb_build_object('error','not_pending'); END IF;
  UPDATE public.duo_requests SET status='cancelled', responded_at=now() WHERE id=_request_id;
  DELETE FROM public.notifications
   WHERE user_id=_req.to_user AND actor_id=_uid AND type='duo_request';
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: get duo status between me and another user
CREATE OR REPLACE FUNCTION public.get_duo_status(_other uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _my_partner uuid;
  _other_partner uuid;
  _cool timestamptz;
  _outgoing uuid;
  _incoming uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('state','anon'); END IF;

  SELECT public.get_duo_partner(_uid) INTO _my_partner;
  SELECT public.get_duo_partner(_other) INTO _other_partner;
  SELECT available_at INTO _cool FROM public.duo_cooldowns WHERE user_id=_uid;

  IF _my_partner = _other THEN
    RETURN jsonb_build_object('state','paired');
  END IF;

  IF _my_partner IS NOT NULL THEN
    RETURN jsonb_build_object('state','self_in_duo');
  END IF;
  IF _other_partner IS NOT NULL THEN
    RETURN jsonb_build_object('state','other_in_duo');
  END IF;

  SELECT id INTO _outgoing FROM public.duo_requests
   WHERE from_user=_uid AND to_user=_other AND status='pending' LIMIT 1;
  IF _outgoing IS NOT NULL THEN
    RETURN jsonb_build_object('state','pending_outgoing','request_id',_outgoing);
  END IF;

  SELECT id INTO _incoming FROM public.duo_requests
   WHERE from_user=_other AND to_user=_uid AND status='pending' LIMIT 1;
  IF _incoming IS NOT NULL THEN
    RETURN jsonb_build_object('state','pending_incoming','request_id',_incoming);
  END IF;

  IF _cool IS NOT NULL AND _cool > now() THEN
    RETURN jsonb_build_object('state','cooldown','available_at',_cool);
  END IF;

  RETURN jsonb_build_object('state','available');
END;
$$;

-- Enable realtime for duo tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.duo_pairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duo_requests;
