-- Ensure the group_chat_messages table is published for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;