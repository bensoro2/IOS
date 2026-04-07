-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own user row" ON public.users;

-- Create a new policy that allows authenticated users to view all user profiles
CREATE POLICY "Authenticated users can view all profiles" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the existing INSERT and UPDATE policies unchanged