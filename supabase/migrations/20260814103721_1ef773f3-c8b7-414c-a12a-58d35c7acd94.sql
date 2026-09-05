CREATE OR REPLACE FUNCTION public.send_mission_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.id, NEW.id, 'mission_1'), (NEW.id, NEW.id, 'mission_2');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_send_mission_notifications ON public.users;
CREATE TRIGGER trg_send_mission_notifications
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.send_mission_notifications();