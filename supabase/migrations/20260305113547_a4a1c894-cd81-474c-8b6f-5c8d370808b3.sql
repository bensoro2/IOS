
-- Add category column to reels table
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS category text DEFAULT null;

-- Create user_reel_preferences table to track category preferences
CREATE TABLE public.user_reel_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  score integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

ALTER TABLE public.user_reel_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own preferences"
  ON public.user_reel_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_reel_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_reel_preferences FOR UPDATE
  USING (auth.uid() = user_id);
