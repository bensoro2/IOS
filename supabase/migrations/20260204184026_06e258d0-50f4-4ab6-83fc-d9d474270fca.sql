-- Create direct_messages table for private chats
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Composite index for conversation lookup
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(sender_id, receiver_id, created_at DESC);

-- RLS Policies
-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update their own sent messages (for read receipts etc)
CREATE POLICY "Users can update received messages read status"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Add to realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;