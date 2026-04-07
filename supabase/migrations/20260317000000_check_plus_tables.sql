-- Table for Check Plus codes (created by activity organizers)
CREATE TABLE public.check_plus_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at DATE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_plus_codes_unique UNIQUE (code, category)
);

-- Table for recording successful Check Plus check-ins
CREATE TABLE public.check_plus_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  code_id UUID NOT NULL REFERENCES public.check_plus_codes(id),
  checked_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_category_checkplus_daily UNIQUE (user_id, category, checked_in_at)
);

-- RLS
ALTER TABLE public.check_plus_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_plus_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active codes"
ON public.check_plus_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can read own check_plus checkins"
ON public.check_plus_checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check_plus checkins"
ON public.check_plus_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update code used_count"
ON public.check_plus_codes FOR UPDATE
USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_check_plus_checkins_user_date ON public.check_plus_checkins(user_id, checked_in_at);
CREATE INDEX idx_check_plus_codes_code ON public.check_plus_codes(code);
