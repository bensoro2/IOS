-- Add policy allowing owner to add members (for approving join requests)
CREATE POLICY "Owner can add members"
ON public.group_chat_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  OR is_group_chat_owner(group_chat_id, auth.uid())
);