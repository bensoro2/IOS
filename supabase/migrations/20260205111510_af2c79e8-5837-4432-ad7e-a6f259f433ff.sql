-- Add is_private column to activities table
ALTER TABLE public.activities
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Update join_requests RLS policy to allow requests for private activities
DROP POLICY IF EXISTS "Kicked users can create join requests" ON public.join_requests;

CREATE POLICY "Users can create join requests for private activities or if kicked"
ON public.join_requests
FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) AND (
    -- Either user is kicked from this group
    EXISTS (
      SELECT 1 FROM kicked_members km
      WHERE km.group_chat_id = join_requests.group_chat_id
        AND km.user_id = auth.uid()
    )
    OR
    -- Or the activity is private and user is not already a member
    EXISTS (
      SELECT 1 FROM activity_group_chats agc
      JOIN activities a ON a.id = agc.activity_id
      WHERE agc.id = join_requests.group_chat_id
        AND a.is_private = true
        AND NOT EXISTS (
          SELECT 1 FROM group_chat_members gcm
          WHERE gcm.group_chat_id = agc.id
            AND gcm.user_id = auth.uid()
        )
    )
  )
);