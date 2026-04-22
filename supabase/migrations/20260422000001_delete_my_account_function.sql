CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  DELETE FROM public.reel_comment_likes WHERE user_id = v_user_id;
  DELETE FROM public.reel_comments WHERE user_id = v_user_id;
  DELETE FROM public.reel_likes WHERE user_id = v_user_id;
  DELETE FROM public.reel_reports WHERE user_id = v_user_id;
  DELETE FROM public.user_reel_preferences WHERE user_id = v_user_id;
  DELETE FROM public.reels WHERE user_id = v_user_id;

  DELETE FROM public.notifications WHERE user_id = v_user_id OR actor_id = v_user_id;
  DELETE FROM public.direct_messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;

  DELETE FROM public.group_chat_last_read WHERE user_id = v_user_id;
  DELETE FROM public.group_chat_messages WHERE user_id = v_user_id;
  DELETE FROM public.kicked_members WHERE user_id = v_user_id OR kicked_by = v_user_id;
  DELETE FROM public.join_requests WHERE user_id = v_user_id;
  DELETE FROM public.group_chat_members WHERE user_id = v_user_id;

  DELETE FROM public.follows WHERE follower_id = v_user_id OR following_id = v_user_id;
  DELETE FROM public.blocks WHERE blocker_id = v_user_id OR blocked_id = v_user_id;
  DELETE FROM public.user_reports WHERE reporter_id = v_user_id OR reported_id = v_user_id;

  DELETE FROM public.user_code_redemptions WHERE redeemer_id = v_user_id OR code_owner_id = v_user_id;
  DELETE FROM public.code_redemptions WHERE user_id = v_user_id;

  UPDATE public.activity_group_chats SET created_by = NULL WHERE created_by = v_user_id;
  UPDATE public.check_plus_codes SET created_by = NULL WHERE created_by = v_user_id;

  DELETE FROM public.user_premium WHERE user_id = v_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.fcm_tokens WHERE user_id = v_user_id;

  DELETE FROM public.check_plus_checkins WHERE user_id = v_user_id;
  DELETE FROM public.activity_checkins WHERE user_id = v_user_id;
  DELETE FROM public.fast_checkins WHERE user_id = v_user_id;
  DELETE FROM public.funding_contributions WHERE user_id = v_user_id;
  DELETE FROM public.shops WHERE user_id = v_user_id;
  DELETE FROM public.activities WHERE user_id = v_user_id;

  DELETE FROM public.users WHERE id = v_user_id;

  -- Delete auth user (SECURITY DEFINER allows this)
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
