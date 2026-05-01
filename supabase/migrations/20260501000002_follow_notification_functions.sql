-- Atomic upsert follow notification (runs as service role, bypasses RLS)
CREATE OR REPLACE FUNCTION upsert_follow_notification(
  p_user_id uuid,
  p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent self-notification
  IF p_user_id = p_actor_id THEN
    RETURN;
  END IF;

  -- Delete any existing follow notification from this actor to prevent duplicates
  DELETE FROM notifications
  WHERE user_id = p_user_id
    AND actor_id = p_actor_id
    AND type = 'follow';

  -- Insert fresh follow notification
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (p_user_id, p_actor_id, 'follow');
END;
$$;

-- Delete follow notification when unfollowing (runs as service role, bypasses RLS)
CREATE OR REPLACE FUNCTION delete_follow_notification(
  p_user_id uuid,
  p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM notifications
  WHERE user_id = p_user_id
    AND actor_id = p_actor_id
    AND type = 'follow';
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION upsert_follow_notification(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_follow_notification(uuid, uuid) TO authenticated;
