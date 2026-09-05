-- Allow users to update their own group chat messages (for soft delete and reactions)
CREATE POLICY "Users can update own group messages"
ON public.group_chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);