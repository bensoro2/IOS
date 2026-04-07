-- Create kicked_members table to track who was kicked
CREATE TABLE public.kicked_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id uuid NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kicked_by uuid NOT NULL,
  kicked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_chat_id, user_id)
);

-- Create join_requests table for re-join requests
CREATE TABLE public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id uuid NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(group_chat_id, user_id)
);

-- Enable RLS
ALTER TABLE public.kicked_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- RLS for kicked_members
CREATE POLICY "Authenticated users can view kicked members"
ON public.kicked_members
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can kick members"
ON public.kicked_members
FOR INSERT
WITH CHECK (is_group_chat_owner(group_chat_id, auth.uid()));

CREATE POLICY "Owner can unkick members"
ON public.kicked_members
FOR DELETE
USING (is_group_chat_owner(group_chat_id, auth.uid()));

-- RLS for join_requests
CREATE POLICY "Users can view their own requests or owner can view requests"
ON public.join_requests
FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_group_chat_owner(group_chat_id, auth.uid())
);

CREATE POLICY "Kicked users can create join requests"
ON public.join_requests
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.kicked_members km
    WHERE km.group_chat_id = join_requests.group_chat_id
    AND km.user_id = auth.uid()
  )
);

CREATE POLICY "Owner can update join requests"
ON public.join_requests
FOR UPDATE
USING (is_group_chat_owner(group_chat_id, auth.uid()));

CREATE POLICY "Users can delete their own pending requests"
ON public.join_requests
FOR DELETE
USING (user_id = auth.uid() AND status = 'pending');