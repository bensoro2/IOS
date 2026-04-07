
CREATE POLICY "Anyone can view user profiles"
ON public.users
FOR SELECT
USING (true);
