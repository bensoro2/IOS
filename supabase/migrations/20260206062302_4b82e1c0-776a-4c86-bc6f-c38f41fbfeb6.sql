-- Create reels table
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  music_name TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reel_likes table
CREATE TABLE public.reel_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- Create reel_comments table
CREATE TABLE public.reel_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- Reels policies
CREATE POLICY "Everyone can view reels"
ON public.reels FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reels"
ON public.reels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
ON public.reels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
ON public.reels FOR DELETE
USING (auth.uid() = user_id);

-- Reel likes policies
CREATE POLICY "Everyone can view reel likes"
ON public.reel_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like reels"
ON public.reel_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike reels"
ON public.reel_likes FOR DELETE
USING (auth.uid() = user_id);

-- Reel comments policies
CREATE POLICY "Everyone can view reel comments"
ON public.reel_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.reel_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.reel_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for reel videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reel-videos', 'reel-videos', true);

-- Storage policies for reel videos
CREATE POLICY "Anyone can view reel videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'reel-videos');

CREATE POLICY "Authenticated users can upload reel videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reel-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reel videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reel-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own reel videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'reel-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX idx_reels_user_id ON public.reels(user_id);
CREATE INDEX idx_reels_created_at ON public.reels(created_at DESC);
CREATE INDEX idx_reel_likes_reel_id ON public.reel_likes(reel_id);
CREATE INDEX idx_reel_comments_reel_id ON public.reel_comments(reel_id);