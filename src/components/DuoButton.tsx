import { useEffect, useState, useCallback } from "react";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type DuoState =
  | { state: "loading" }
  | { state: "anon" }
  | { state: "available" }
  | { state: "paired" }
  | { state: "self_in_duo" }
  | { state: "other_in_duo" }
  | { state: "pending_outgoing"; request_id: string }
  | { state: "pending_incoming"; request_id: string }
  | { state: "cooldown"; available_at: string };

interface DuoButtonProps {
  targetUserId: string;
  currentUserId: string | null;
  onChanged?: () => void;
}

export const DuoButton = ({ targetUserId, currentUserId, onChanged }: DuoButtonProps) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<DuoState>({ state: "loading" });
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!currentUserId || currentUserId === targetUserId) {
      setStatus({ state: "anon" });
      return;
    }
    const { data, error } = await supabase.rpc("get_duo_status" as any, { _other: targetUserId });
    if (error) {
      console.error("duo status error", error);
      setStatus({ state: "available" });
      return;
    }
    setStatus(data as DuoState);
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClick = async () => {
    if (busy || status.state === "loading") return;

    if (status.state === "paired") {
      setConfirmCancel(true);
      return;
    }

    if (status.state === "self_in_duo") {
      toast.error(t("duo.selfInDuo"));
      return;
    }
    if (status.state === "other_in_duo") {
      toast.error(t("duo.otherInDuo"));
      return;
    }
    if (status.state === "cooldown") {
      const until = new Date(status.available_at);
      const days = Math.ceil((until.getTime() - Date.now()) / 86400000);
      toast.error(t("duo.cooldownWait").replace("{days}", String(days)));
      return;
    }
    if (status.state === "pending_incoming") {
      toast.info(t("duo.checkNotifications"));
      return;
    }

    setBusy(true);
    try {
      if (status.state === "pending_outgoing") {
        const { data, error } = await supabase.rpc("cancel_duo_request" as any, { _request_id: status.request_id });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        toast.success(t("duo.requestCancelled"));
      } else {
        const { data, error } = await supabase.rpc("send_duo_request" as any, { _target: targetUserId });
        if (error) throw error;
        const err = (data as any)?.error;
        if (err) {
          if (err === "cooldown") toast.error(t("duo.cooldownActive"));
          else if (err === "already_in_duo") toast.error(t("duo.selfInDuo"));
          else if (err === "target_in_duo") toast.error(t("duo.otherInDuo"));
          else if (err === "pending_exists") toast.error(t("duo.pendingExists"));
          else toast.error(err);
          await fetchStatus();
          return;
        }
        toast.success(t("duo.requestSent"));
      }
      await fetchStatus();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    setConfirmCancel(false);
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("cancel_duo" as any);
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(t("duo.duoEnded"));
      await fetchStatus();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  if (!currentUserId || currentUserId === targetUserId || status.state === "anon") return null;

  // Color logic
  let iconClass = "w-4 h-4";
  let variant: "default" | "outline" | "secondary" = "outline";
  let label = t("duo.request");

  if (status.state === "paired") {
    iconClass += " text-green-500";
    label = t("duo.paired");
    variant = "outline";
  } else if (status.state === "pending_outgoing") {
    iconClass += " text-primary";
    label = t("duo.pending");
    variant = "secondary";
  } else if (status.state === "pending_incoming") {
    iconClass += " text-primary";
    label = t("duo.respond");
    variant = "secondary";
  } else if (status.state === "cooldown") {
    iconClass += " opacity-40";
    label = t("duo.cooldown");
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        className="gap-2"
        disabled={busy || status.state === "loading"}
      >
        {busy || status.state === "loading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Users className={iconClass} />
        )}
        <span className="hidden sm:inline">{label}</span>
      </Button>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("duo.confirmEndTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("duo.confirmEndDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90">
              {t("duo.endDuo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
