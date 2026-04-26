-- Required for Supabase Realtime UPDATE events with column filters
-- Without this, read receipt real-time updates won't work reliably
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
