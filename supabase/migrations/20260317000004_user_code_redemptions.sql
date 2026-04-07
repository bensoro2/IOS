-- Track which user codes each user has already redeemed (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.user_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  redeemer_id UUID NOT NULL REFERENCES auth.users(id),
  code_owner_id UUID NOT NULL REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_code_redemption UNIQUE (redeemer_id, code_owner_id)
);

ALTER TABLE public.user_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
ON public.user_code_redemptions FOR SELECT
USING (auth.uid() = redeemer_id);

CREATE POLICY "Users can insert own redemptions"
ON public.user_code_redemptions FOR INSERT
WITH CHECK (auth.uid() = redeemer_id);
