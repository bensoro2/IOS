-- Create blocks table for user blocking system
CREATE TABLE public.blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (who they blocked)
CREATE POLICY "Users can view own blocks"
ON public.blocks
FOR SELECT
USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block others"
ON public.blocks
FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

-- Users can unblock
CREATE POLICY "Users can unblock"
ON public.blocks
FOR DELETE
USING (auth.uid() = blocker_id);

-- Create function to check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(blocker uuid, blocked uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocks b
    WHERE b.blocker_id = blocker
      AND b.blocked_id = blocked
  );
$$;