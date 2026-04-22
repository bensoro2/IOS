ALTER TABLE public.group_chat_messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.group_chat_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_preview TEXT;

CREATE POLICY "Users can update their own group messages"
ON public.group_chat_messages FOR UPDATE
USING (auth.uid() = user_id);
