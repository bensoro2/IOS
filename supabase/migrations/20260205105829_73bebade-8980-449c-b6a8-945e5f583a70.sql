-- Create promo_codes table to store available codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  premium_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create code_redemptions table to track who redeemed which codes
CREATE TABLE public.code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_premium table to track premium status
CREATE TABLE public.user_premium (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  premium_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes (anyone can view active codes for validation)
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS Policies for code_redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.code_redemptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
ON public.code_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_premium
CREATE POLICY "Users can view their own premium status"
ON public.user_premium
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own premium status"
ON public.user_premium
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium status"
ON public.user_premium
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update promo_codes current_uses
CREATE OR REPLACE FUNCTION public.increment_promo_code_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_code_redemption
AFTER INSERT ON public.code_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.increment_promo_code_uses();

-- Create function to update user_premium updated_at
CREATE OR REPLACE FUNCTION public.update_user_premium_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_premium_timestamp
BEFORE UPDATE ON public.user_premium
FOR EACH ROW
EXECUTE FUNCTION public.update_user_premium_updated_at();

-- Insert a sample promo code for testing
INSERT INTO public.promo_codes (code, premium_days, max_uses, is_active)
VALUES ('WELCOME30', 30, 100, true);