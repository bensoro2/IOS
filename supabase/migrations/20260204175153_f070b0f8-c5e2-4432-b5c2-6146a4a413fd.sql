-- Create fast check-ins table (separate from group activity check-ins)
CREATE TABLE public.fast_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  checked_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fast_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own fast check-ins
CREATE POLICY "Users can view own fast check-ins"
ON public.fast_checkins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own fast check-ins
CREATE POLICY "Users can create own fast check-ins"
ON public.fast_checkins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_fast_checkins_user_date ON public.fast_checkins(user_id, checked_in_at);