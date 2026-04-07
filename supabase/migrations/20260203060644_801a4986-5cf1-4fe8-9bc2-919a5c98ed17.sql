-- 1) Fix infinite recursion by using a SECURITY DEFINER helper function
CREATE OR REPLACE FUNCTION public.is_group_member(_group_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_chat_members gcm
    WHERE gcm.group_chat_id = _group_chat_id
      AND gcm.user_id = _user_id
  );
$$;

-- 2) Recreate chat policies to avoid any self-referencing in RLS
DROP POLICY IF EXISTS "Users can view group chats" ON public.activity_group_chats;
CREATE POLICY "Users can view group chats"
ON public.activity_group_chats
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_group_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Users can view group chat members" ON public.group_chat_members;
CREATE POLICY "Users can view group chat members"
ON public.group_chat_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_group_member(group_chat_id, auth.uid())
);

-- (Keep INSERT policy as simple self-join only)
DROP POLICY IF EXISTS "Users can join group chats" ON public.group_chat_members;
CREATE POLICY "Users can join group chats"
ON public.group_chat_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3) SECURITY: enable RLS on exposed tables without RLS (linter errors)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users table policies (self-only)
DROP POLICY IF EXISTS "Users can view own user row" ON public.users;
CREATE POLICY "Users can view own user row"
ON public.users
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own user row" ON public.users;
CREATE POLICY "Users can insert own user row"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user row" ON public.users;
CREATE POLICY "Users can update own user row"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Payments table policies (self-only)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
CREATE POLICY "Users can create own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
ON public.payments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
