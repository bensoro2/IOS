-- Drop existing SELECT policy on activity_group_chats
DROP POLICY IF EXISTS "Users can view group chats" ON public.activity_group_chats;

-- Create new policy that allows all authenticated users to view group chats
-- This is needed so users can join activities
CREATE POLICY "Authenticated users can view group chats"
ON public.activity_group_chats
FOR SELECT
TO authenticated
USING (true);