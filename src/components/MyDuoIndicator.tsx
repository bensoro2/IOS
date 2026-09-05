import { useEffect, useState, useCallback } from "react";
import { Users, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Partner {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const MyDuoIndicator = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) {
        setPartner(null);
        return;
      }

      let partnerId: string | null = null;

      const { data: rpcPartner, error } = await supabase.rpc("get_duo_partner" as any, {
        _user_id: uid,
      });
      if (error) console.error("get_duo_partner error", error);
      if (rpcPartner) partnerId = rpcPartner as string;

      // Fallback: read the pair row directly (RLS allows both members)
      if (!partnerId) {
        const { data: pair } = await supabase
          .from("duo_pairs")
          .select("user_a, user_b")
          .or(`user_a.eq.${uid},user_b.eq.${uid}`)
          .maybeSingle();
        if (pair) partnerId = pair.user_a === uid ? pair.user_b : pair.user_a;
      }

      if (!partnerId) {
        setPartner(null);
        return;
      }

      const { data: u } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .eq("id", partnerId)
        .maybeSingle();

      // Preload the avatar so we never flash an empty/initial placeholder
      if (u?.avatar_url) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = u.avatar_url as string;
          // safety timeout so the spinner never hangs
          setTimeout(resolve, 4000);
        });
      }

      if (u) {
        setPartner({ id: u.id, display_name: u.display_name, avatar_url: u.avatar_url });
      } else {
        setPartner({ id: partnerId, display_name: null, avatar_url: null });
      }
    } catch (e) {
      console.error("duo partner load", e);
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    load();

    const channel = supabase
      .channel("duo-pairs-indicator")
      .on("postgres_changes", { event: "*", schema: "public", table: "duo_pairs" }, () => {
        load();
      })
      .subscribe();

    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);


  const handleClick = () => {
    if (loading) return;
    if (partner) {
      setMenuOpen(true);
    } else {
      toast.info(t("duo.noPartnerHint"));
    }
  };

  const handleEnd = async () => {
    setConfirmEnd(false);
    setMenuOpen(false);
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("cancel_duo" as any);
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(t("duo.duoEnded"));
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || busy}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background/60 hover:bg-muted/50 transition-colors disabled:opacity-50"
        aria-label="Duo"
      >
        {loading || busy ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : partner ? (
          <>
            <Avatar className="w-7 h-7 ring-2 ring-green-500">
              <AvatarImage src={partner.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {partner.display_name?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
              <Users className="w-3 h-3 text-green-500" />
            </span>
          </>
        ) : (
          <Users className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="[&>button]:hidden">
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={t("duo.closeDialog")}
            >
              <XCircle className="h-5 w-5 text-primary" />
            </button>
          </div>
          <DialogHeader className="pr-8">
            <DialogTitle>{t("duo.currentDuo")}</DialogTitle>
            <DialogDescription>
              {partner?.display_name || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 py-2">
            <Avatar className="w-12 h-12 ring-2 ring-green-500">
              <AvatarImage src={partner?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {partner?.display_name?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => {
                setMenuOpen(false);
                if (partner) navigate(`/user/${partner.id}`);
              }}
              className="text-sm text-primary underline"
            >
              {t("duo.viewProfile")}
            </button>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setConfirmEnd(true)}
            >
              {t("duo.endDuo")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("duo.confirmEndTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("duo.confirmEndDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd} className="bg-destructive hover:bg-destructive/90">
              {t("duo.endDuo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
