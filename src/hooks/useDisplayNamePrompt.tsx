import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const useDisplayNamePrompt = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const check = async (user: any) => {
      const hasName =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name;
      if (!hasName) {
        setUserId(user.id);
        setOpen(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) check(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) check(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || !userId) return;
    setSaving(true);
    try {
      await supabase.auth.updateUser({ data: { display_name: trimmed } });
      await supabase.from("users").update({ display_name: trimmed }).eq("id", userId);
      setOpen(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const Prompt = () => (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("auth.setDisplayName") || "ตั้งชื่อที่แสดง"}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("auth.setDisplayNameDesc") || "กรุณาตั้งชื่อที่จะแสดงให้ผู้อื่นเห็น"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("auth.displayNamePlaceholder") || "ชื่อของคุณ"}
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? t("common.processing") || "กำลังบันทึก..." : t("common.save") || "บันทึก"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { Prompt };
};
