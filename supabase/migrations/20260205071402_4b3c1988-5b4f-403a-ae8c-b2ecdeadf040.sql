-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view non-blocked profiles" ON public.users;

-- Create new policy that allows viewing all authenticated user profiles
-- The UI will handle showing 0 stats for blocked users
CREATE POLICY "Authenticated users can view all profiles"
ON public.users
FOR SELECT
USING (
  auth.uid() = id 
  OR auth.role() = 'authenticated'::text
);