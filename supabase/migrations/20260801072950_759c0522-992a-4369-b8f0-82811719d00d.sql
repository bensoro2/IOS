CREATE OR REPLACE FUNCTION public.cancel_duo()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _partner uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT public.get_duo_partner(_uid) INTO _partner;
  IF _partner IS NULL THEN RETURN jsonb_build_object('error','no_duo'); END IF;

  DELETE FROM public.duo_pairs
   WHERE (user_a=_uid AND user_b=_partner) OR (user_a=_partner AND user_b=_uid);

  DELETE FROM public.duo_cooldowns WHERE user_id IN (_uid, _partner);

  INSERT INTO public.notifications(user_id, actor_id, type)
  VALUES (_partner, _uid, 'duo_cancelled');

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_duo_request(_target uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
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
$function$;

CREATE OR REPLACE FUNCTION public.get_duo_status(_other uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _my_partner uuid;
  _other_partner uuid;
  _outgoing uuid;
  _incoming uuid;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('state','anon'); END IF;

  SELECT public.get_duo_partner(_uid) INTO _my_partner;
  SELECT public.get_duo_partner(_other) INTO _other_partner;

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

  RETURN jsonb_build_object('state','available');
END;
$function$;

DELETE FROM public.duo_cooldowns;