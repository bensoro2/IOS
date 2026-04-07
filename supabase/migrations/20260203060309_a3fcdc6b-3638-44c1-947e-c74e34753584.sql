-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view group chats" ON public.activity_group_chats;
DROP POLICY IF EXISTS "Users can join group chats" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can view group chat members" ON public.group_chat_members;

-- Recreate activity_group_chats SELECT policy without recursion
-- Allow viewing if user created the activity OR user is a member (using simple check)
CREATE POLICY "Users can view group chats" 
ON public.activity_group_chats 
FOR SELECT 
USING (
  created_by = auth.uid() 
  OR id IN (
    SELECT group_chat_id FROM public.group_chat_members WHERE user_id = auth.uid()
  )
);

-- Recreate group_chat_members INSERT policy - simpler version
-- Allow inserting if user is adding themselves
CREATE POLICY "Users can join group chats" 
ON public.group_chat_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Recreate group_chat_members SELECT policy without recursion  
-- Allow viewing if user is a member of the same group
CREATE POLICY "Users can view group chat members" 
ON public.group_chat_members 
FOR SELECT 
USING (
  group_chat_id IN (
    SELECT group_chat_id FROM public.group_chat_members WHERE user_id = auth.uid()
  )
);