-- Required for Supabase Realtime postgres_changes filters on non-PK columns
-- Without this, filter group_chat_id=eq.{id} won't work for group chat notifications
ALTER TABLE public.group_chat_messages REPLICA IDENTITY FULL;
