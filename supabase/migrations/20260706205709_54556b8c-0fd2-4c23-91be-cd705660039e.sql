DROP TRIGGER IF EXISTS trg_award_star_coin_on_fast_checkin ON public.fast_checkins;
CREATE TRIGGER trg_award_star_coin_on_fast_checkin
AFTER INSERT ON public.fast_checkins
FOR EACH ROW EXECUTE FUNCTION public.award_star_coin_on_checkin();