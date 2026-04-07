-- Add category column to activity_checkins table to preserve EXP even when activity is deleted
ALTER TABLE public.activity_checkins 
ADD COLUMN category text;

-- Update existing check-ins with category from their activities (if still exists)
UPDATE public.activity_checkins ac
SET category = a.category
FROM public.activity_group_chats agc
JOIN public.activities a ON agc.activity_id = a.id
WHERE ac.group_chat_id = agc.id
AND ac.category IS NULL;