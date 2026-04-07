-- Create activity_group_chats table to store group chats for activities
CREATE TABLE public.activity_group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(activity_id)
);

-- Create group_chat_members table
CREATE TABLE public.group_chat_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_chat_id, user_id)
);

-- Create group_chat_messages table
CREATE TABLE public.group_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_group_chats
CREATE POLICY "Users can view group chats they are members of"
ON public.activity_group_chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_chat_id = activity_group_chats.id
    AND group_chat_members.user_id = auth.uid()
  )
);

CREATE POLICY "Activity creator can create group chat"
ON public.activity_group_chats FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- RLS Policies for group_chat_members
CREATE POLICY "Users can view members of their group chats"
ON public.group_chat_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members AS gcm
    WHERE gcm.group_chat_id = group_chat_members.group_chat_id
    AND gcm.user_id = auth.uid()
  )
);

CREATE POLICY "Group chat creator can add members"
ON public.group_chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activity_group_chats
    WHERE activity_group_chats.id = group_chat_members.group_chat_id
    AND activity_group_chats.created_by = auth.uid()
  )
  OR user_id = auth.uid()
);

-- RLS Policies for group_chat_messages
CREATE POLICY "Members can view group messages"
ON public.group_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_chat_id = group_chat_messages.group_chat_id
    AND group_chat_members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.group_chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_chat_members.group_chat_id = group_chat_messages.group_chat_id
    AND group_chat_members.user_id = auth.uid()
  )
);