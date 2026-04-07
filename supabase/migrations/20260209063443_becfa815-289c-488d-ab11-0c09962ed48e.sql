-- Insert test promo codes for Pro and Gold plans (5 minutes duration)
INSERT INTO public.promo_codes (code, plan_type, premium_days, is_active, expires_at, max_uses)
VALUES 
  ('TESTPRO5', 'pro', 1, true, now() + interval '1 hour', 10),
  ('TESTGOLD5', 'gold', 1, true, now() + interval '1 hour', 10)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  expires_at = now() + interval '1 hour',
  current_uses = 0;