-- Add user_code column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

-- Function to generate a unique 7-char user code (e.g. uXh53l4)
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT;
  done BOOL;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    result := 'u';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    done := NOT EXISTS (SELECT 1 FROM public.users WHERE user_code = result);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-assign user_code on new user insert
CREATE OR REPLACE FUNCTION assign_user_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_code IS NULL THEN
    NEW.user_code := generate_user_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_user_code
BEFORE INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION assign_user_code();

-- Assign codes to existing users who don't have one yet
UPDATE public.users SET user_code = generate_user_code() WHERE user_code IS NULL;
