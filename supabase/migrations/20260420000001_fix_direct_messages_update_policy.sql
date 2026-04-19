-- Fix: allow senders to update their own direct messages (for soft-delete)
-- Previously only receivers could update (for read receipts), so senders couldn't delete their own messages.
DROP POLICY IF EXISTS "Users can update received messages read status" ON public.direct_messages;

CREATE POLICY "Users can update messages they sent or received"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
