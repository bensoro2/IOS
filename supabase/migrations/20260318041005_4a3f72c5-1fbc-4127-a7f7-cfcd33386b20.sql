ALTER TABLE promo_codes DROP CONSTRAINT promo_valid_plan_type;
ALTER TABLE promo_codes ADD CONSTRAINT promo_valid_plan_type CHECK (plan_type = ANY (ARRAY['pro'::text, 'gold'::text, 'check_plus'::text]));
INSERT INTO promo_codes (code, plan_type, premium_days, max_uses, is_active, expires_at) VALUES ('LEVEL-ON', 'pro', 30, NULL, true, NULL), ('LEVEL-BOOST', 'check_plus', 0, NULL, true, NULL);