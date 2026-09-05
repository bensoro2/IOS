DROP POLICY IF EXISTS "Members can view group messages" ON public.group_chat_messages;

CREATE POLICY "Members can view group messages"
ON public.group_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members m
    WHERE m.group_chat_id = group_chat_messages.group_chat_id
      AND m.user_id = auth.uid()
      AND group_chat_messages.created_at >= m.joined_at
  )
);