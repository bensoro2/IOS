-- Update activity_checkins RLS to allow viewing other users' check-ins
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.activity_checkins;
CREATE POLICY "Authenticated users can view all check-ins" 
ON public.activity_checkins 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update fast_checkins RLS to allow viewing other users' fast check-ins
DROP POLICY IF EXISTS "Users can view own fast check-ins" ON public.fast_checkins;
CREATE POLICY "Authenticated users can view all fast check-ins" 
ON public.fast_checkins 
FOR SELECT 
USING (auth.role() = 'authenticated');