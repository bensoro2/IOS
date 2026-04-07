-- Update RLS policy for direct_messages to allow viewing old messages with blocked users
DROP POLICY IF EXISTS "Users can view messages with non-blocked users" ON public.direct_messages;

-- Allow viewing all messages (including from blocked users)
CREATE POLICY "Users can view their messages"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Keep the policy that prevents sending to blocked users (already exists as "Users can send messages to non-blocked users")