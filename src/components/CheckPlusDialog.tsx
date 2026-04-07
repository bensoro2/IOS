import { useState, useEffect, useMemo } from "react";
import { ClipboardCheck, Check, Loader2, Search, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ACTIVITY_CATEGORIES, getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";

interface CheckPlusDialogProps {
  trigger?: React.ReactNode;
  onCheckInComplete?: () => void;
}

export const CheckPlusDialog = ({ trigger, onCheckInComplete }: CheckPlusDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [points, setPoints] = useState(0);

  const getTodayDateThailand = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("user_code, check_plus_points")
        .eq("id", user.id)
        .maybeSingle();

      setMyCode((userData as any)?.user_code || null);
      setPoints((userData as any)?.check_plus_points ?? 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      setSearchQuery("");
    }
  }, [open]);

  const handleCheckIn = async (categoryId: string) => {
    if (points <= 0) {
      toast({ title: t("checkPlus.notEnoughPoints"), description: t("checkPlus.notEnoughPointsDesc"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t("checkPlus.loginRequired"), variant: "destructive" });
        return;
      }

      const today = getTodayDateThailand();

      const { error: insertError } = await supabase
        .from("check_plus_checkins")
        .insert({ user_id: user.id, category: categoryId, code_id: null, checked_in_at: today });

      if (insertError) throw insertError;

      // Deduct 1 point
      await supabase.from("users").update({ check_plus_points: points - 1 }).eq("id", user.id);
      setPoints((p) => p - 1);

      const subCat = getSubCategoryById(categoryId);
      toast({ title: t("checkPlus.success"), description: `${t("checkPlus.expFor")} ${subCat?.emoji} ${subCat ? getLocalizedName(subCat, language) : categoryId}` });

      onCheckInComplete?.();
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({ title: t("checkPlus.error"), description: error.message || t("checkPlus.cannotCheckin"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return ACTIVITY_CATEGORIES;
    const q = searchQuery.trim().toLowerCase();
    return ACTIVITY_CATEGORIES.map((cat) => ({
      ...cat,
      subCategories: cat.subCategories.filter(
        (sub) => sub.name.toLowerCase().includes(q) || getLocalizedName(sub, language).toLowerCase().includes(q) || sub.emoji.includes(q)
      ),
    })).filter((cat) => cat.subCategories.length > 0);
  }, [searchQuery, language]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <ClipboardCheck className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Check Plus
          </DialogTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {t("checkPlus.selectActivity")}
            <span className="font-semibold text-primary">({points} {t("checkPlus.points")})</span>
          </p>
        </DialogHeader>

        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("checkPlus.searchActivity")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {myCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(myCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }}
              className="flex items-center gap-1 px-2 h-9 rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0"
            >
              <span className="font-mono text-xs font-semibold tracking-wider">{myCode}</span>
              {codeCopied
                ? <Check className="w-3 h-3 text-green-500" />
                : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          )}
        </div>

        <ScrollArea className="h-[400px] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span>{category.emoji}</span>
                    <span>{getLocalizedName(category, language)}</span>
                  </h3>
                  <div className="space-y-1">
                    {category.subCategories.map((sub) => {
                      const disabled = points <= 0 || isSubmitting;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleCheckIn(sub.id)}
                          disabled={disabled}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            disabled
                              ? "bg-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{sub.emoji}</span>
                            <span>{getLocalizedName(sub, language)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
