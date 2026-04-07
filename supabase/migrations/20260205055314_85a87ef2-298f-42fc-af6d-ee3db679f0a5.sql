-- Create a security definer function to check if user is the group chat owner
CREATE OR REPLACE FUNCTION public.is_group_chat_owner(_group_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.activity_group_chats agc
    WHERE agc.id = _group_chat_id
      AND agc.created_by = _user_id
  );
$$;

-- Allow group chat owner to kick members (delete from group_chat_members)
CREATE POLICY "Owner can remove members"
ON public.group_chat_members
FOR DELETE
USING (
  is_group_chat_owner(group_chat_id, auth.uid())
  OR user_id = auth.uid()
);