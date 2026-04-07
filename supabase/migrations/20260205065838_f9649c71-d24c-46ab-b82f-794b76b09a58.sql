-- Create security definer function to check if users are blocking each other
CREATE OR REPLACE FUNCTION public.are_users_blocked(user1 uuid, user2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocks b
    WHERE (b.blocker_id = user1 AND b.blocked_id = user2)
       OR (b.blocker_id = user2 AND b.blocked_id = user1)
  );
$$;

-- Drop existing policies for direct_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;

-- Create new policies that respect blocking
CREATE POLICY "Users can view messages with non-blocked users"
ON public.direct_messages
FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND NOT are_users_blocked(sender_id, receiver_id)
);

CREATE POLICY "Users can send messages to non-blocked users"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND NOT are_users_blocked(sender_id, receiver_id)
);

-- Drop existing policy for users table
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

-- Create new policy that respects blocking for viewing profiles
CREATE POLICY "Users can view non-blocked profiles"
ON public.users
FOR SELECT
USING (
  auth.uid() = id -- Can always view own profile
  OR (
    auth.role() = 'authenticated'
    AND NOT are_users_blocked(auth.uid(), id)
  )
);