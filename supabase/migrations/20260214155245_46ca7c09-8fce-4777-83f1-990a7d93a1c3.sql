
CREATE TABLE public.reel_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reel_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reel_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.reel_reports FOR SELECT USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_reel_reports_unique ON public.reel_reports(reel_id, user_id);
