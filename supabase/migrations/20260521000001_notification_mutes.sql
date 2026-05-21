-- Table to store per-user notification mute preferences for group chats and DMs
-- Replaces localStorage-only muting so the Edge Function can respect it server-side

CREATE TABLE IF NOT EXISTS public.notification_mutes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_type   text        NOT NULL CHECK (chat_type IN ('group', 'dm')),
  chat_id     text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, chat_type, chat_id)
);

ALTER TABLE public.notification_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification mutes"
ON public.notification_mutes
FOR ALL
USING  (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
