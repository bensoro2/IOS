-- Fix 1: Enable realtime for join_requests so the owner sees the badge update in real-time
ALTER TABLE public.join_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Fix 2: Allow kicked users to reset their own request back to pending
-- Previously only group owners could update join_requests, which caused the
-- re-join request to silently fail when a user was kicked a second time.
DROP POLICY IF EXISTS "Owner can update join requests" ON public.join_requests;

CREATE POLICY "Owner or kicked user can update join request status"
ON public.join_requests
FOR UPDATE
USING (
  is_group_chat_owner(group_chat_id, auth.uid())
  OR (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.kicked_members km
      WHERE km.group_chat_id = join_requests.group_chat_id
        AND km.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  is_group_chat_owner(group_chat_id, auth.uid())
  OR (user_id = auth.uid() AND status = 'pending')
);
