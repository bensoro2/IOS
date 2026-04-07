-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view group chats they are members of" ON activity_group_chats;
DROP POLICY IF EXISTS "Activity creator can create group chat" ON activity_group_chats;
DROP POLICY IF EXISTS "Users can view members of their group chats" ON group_chat_members;
DROP POLICY IF EXISTS "Group chat creator can add members" ON group_chat_members;

-- Create fixed policies for activity_group_chats
-- Allow creators to view their own group chats OR members to view
CREATE POLICY "Users can view group chats" 
ON activity_group_chats 
FOR SELECT 
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_chat_members.group_chat_id = activity_group_chats.id 
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Allow activity creators to create group chat
CREATE POLICY "Activity creator can create group chat" 
ON activity_group_chats 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Create fixed policies for group_chat_members
-- Simple SELECT policy - users can view their own membership records
CREATE POLICY "Users can view group chat members" 
ON group_chat_members 
FOR SELECT 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM activity_group_chats 
    WHERE activity_group_chats.id = group_chat_members.group_chat_id 
    AND activity_group_chats.created_by = auth.uid()
  )
);

-- Allow group chat creator to add members OR users to add themselves
CREATE POLICY "Users can join group chats" 
ON group_chat_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM activity_group_chats 
    WHERE activity_group_chats.id = group_chat_members.group_chat_id 
    AND activity_group_chats.created_by = auth.uid()
  )
);