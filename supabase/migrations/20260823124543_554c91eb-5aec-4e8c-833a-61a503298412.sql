CREATE INDEX IF NOT EXISTS idx_activities_province_created ON public.activities (province, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_group_chat_previews(_ids uuid[])
RETURNS TABLE (
  group_chat_id uuid,
  member_count bigint,
  content text,
  created_at timestamptz,
  media_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH allowed AS (
    SELECT m.group_chat_id AS gid
    FROM public.group_chat_members m
    WHERE m.user_id = auth.uid()
      AND m.group_chat_id = ANY(_ids)
  ),
  counts AS (
    SELECT m.group_chat_id AS gid, count(*) AS cnt
    FROM public.group_chat_members m
    WHERE m.group_chat_id IN (SELECT gid FROM allowed)
    GROUP BY m.group_chat_id
  ),
  last_msg AS (
    SELECT DISTINCT ON (g.group_chat_id)
      g.group_chat_id AS gid, g.content, g.created_at, g.media_type
    FROM public.group_chat_messages g
    WHERE g.group_chat_id IN (SELECT gid FROM allowed)
    ORDER BY g.group_chat_id, g.created_at DESC
  )
  SELECT a.gid, coalesce(c.cnt, 0), l.content, l.created_at, l.media_type
  FROM allowed a
  LEFT JOIN counts c ON c.gid = a.gid
  LEFT JOIN last_msg l ON l.gid = a.gid;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_chat_previews(uuid[]) TO authenticated;