-- Add new columns to activities table
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS max_participants TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
-- Everyone can view all activities
CREATE POLICY "Anyone can view activities"
ON public.activities
FOR SELECT
USING (true);

-- Authenticated users can create their own activities
CREATE POLICY "Authenticated users can create activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
ON public.activities
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);