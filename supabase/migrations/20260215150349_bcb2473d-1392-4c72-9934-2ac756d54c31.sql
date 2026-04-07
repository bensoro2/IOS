
-- Add parent_id to reel_comments for reply threading
ALTER TABLE public.reel_comments
ADD COLUMN parent_id uuid REFERENCES public.reel_comments(id) ON DELETE CASCADE;

-- Create index for faster reply lookups
CREATE INDEX idx_reel_comments_parent_id ON public.reel_comments(parent_id);

-- Create reel_comment_likes table
CREATE TABLE public.reel_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reel_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Everyone can view comment likes"
ON public.reel_comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON public.reel_comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON public.reel_comment_likes FOR DELETE
USING (auth.uid() = user_id);
