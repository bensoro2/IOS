-- Create check-ins table for tracking daily activity check-ins
CREATE TABLE public.activity_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_chat_id UUID NOT NULL REFERENCES public.activity_group_chats(id) ON DELETE CASCADE,
  checked_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure user can only check-in once per day across all activities
  CONSTRAINT unique_user_daily_checkin UNIQUE (user_id, checked_in_at)
);

-- Enable Row Level Security
ALTER TABLE public.activity_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "Users can view own check-ins"
ON public.activity_checkins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own check-ins (must be group member)
CREATE POLICY "Users can create own check-ins"
ON public.activity_checkins
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_group_member(group_chat_id, auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_checkins_user_date ON public.activity_checkins(user_id, checked_in_at);
CREATE INDEX idx_checkins_group ON public.activity_checkins(group_chat_id);