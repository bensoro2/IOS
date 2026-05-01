-- Allow actors to delete follow notifications they created
-- This is needed so a follower can remove the follow notification when they unfollow,
-- and so duplicate follow notifications can be cleaned up before re-inserting.
CREATE POLICY "Actors can delete their own follow notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = actor_id AND type = 'follow');
