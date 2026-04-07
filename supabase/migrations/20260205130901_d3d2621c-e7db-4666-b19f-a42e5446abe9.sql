-- Add plan_type column to user_premium table
ALTER TABLE public.user_premium 
ADD COLUMN plan_type text NOT NULL DEFAULT 'pro';

-- Add constraint to ensure valid plan types
ALTER TABLE public.user_premium 
ADD CONSTRAINT valid_plan_type CHECK (plan_type IN ('pro', 'gold'));

-- Update promo_codes table to include plan_type for codes
ALTER TABLE public.promo_codes 
ADD COLUMN plan_type text NOT NULL DEFAULT 'pro';

ALTER TABLE public.promo_codes 
ADD CONSTRAINT promo_valid_plan_type CHECK (plan_type IN ('pro', 'gold'));

-- Update existing WELCOME30 code to be a pro plan code
UPDATE public.promo_codes SET plan_type = 'pro' WHERE code = 'WELCOME30';

-- Insert a gold plan promo code for testing
INSERT INTO public.promo_codes (code, premium_days, plan_type, is_active)
VALUES ('GOLDTEST30', 30, 'gold', true)
ON CONFLICT (code) DO NOTHING;