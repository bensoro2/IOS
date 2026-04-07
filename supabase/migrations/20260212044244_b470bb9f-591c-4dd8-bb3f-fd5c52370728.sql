
-- Create table for tracking last read timestamp in group chats
CREATE TABLE public.group_chat_last_read (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  group_chat_id uuid NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_chat_id)
);

-- Enable RLS
ALTER TABLE public.group_chat_last_read ENABLE ROW LEVEL SECURITY;

-- Users can view their own read status
CREATE POLICY "Users can view own read status"
ON public.group_chat_last_read
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own read status
CREATE POLICY "Users can insert own read status"
ON public.group_chat_last_read
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own read status
CREATE POLICY "Users can update own read status"
ON public.group_chat_last_read
FOR UPDATE
USING (auth.uid() = user_id);
