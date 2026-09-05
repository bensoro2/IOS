CREATE INDEX IF NOT EXISTS idx_gcm_chat_created ON public.group_chat_messages (group_chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gc_members_user ON public.group_chat_members (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities (user_id);
CREATE INDEX IF NOT EXISTS idx_gc_last_read_user ON public.group_chat_last_read (user_id, group_chat_id);