import { useState, useEffect, useMemo } from "react";
import { Zap, Check, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ACTIVITY_CATEGORIES, getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";

interface FastCheckInDialogProps {
  trigger?: React.ReactNode;
  onCheckInComplete?: () => void;
}

const MAX_FAST_CHECKINS_PER_DAY = 2;

export const FastCheckInDialog = ({ trigger, onCheckInComplete }: FastCheckInDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [todayFastCheckins, setTodayFastCheckins] = useState<string[]>([]);
  const [todayActivityCheckins, setTodayActivityCheckins] = useState<string[]>([]);
  const [remainingCheckins, setRemainingCheckins] = useState(MAX_FAST_CHECKINS_PER_DAY);

  const getTodayDateThailand = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  };

  const fetchTodayCheckins = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getTodayDateThailand();

      // Fetch today's fast check-ins
      const { data: fastCheckins, error: fastError } = await supabase
        .from("fast_checkins")
        .select("category")
        .eq("user_id", user.id)
        .eq("checked_in_at", today);

      if (fastError) throw fastError;

      // Fetch today's activity group check-ins
      const { data: activityCheckins, error: activityError } = await supabase
        .from("activity_checkins")
        .select("category")
        .eq("user_id", user.id)
        .eq("checked_in_at", today);

      if (activityError) throw activityError;

      const fastCategories = fastCheckins?.map(c => c.category) || [];
      const activityCategories = activityCheckins?.map(c => c.category).filter(Boolean) as string[] || [];

      setTodayFastCheckins(fastCategories);
      setTodayActivityCheckins(activityCategories);
      setRemainingCheckins(MAX_FAST_CHECKINS_PER_DAY - fastCategories.length);
    } catch (error) {
      console.error("Error fetching today's check-ins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTodayCheckins();
    }
  }, [open]);

  const handleCheckIn = async (categoryId: string) => {
    if (remainingCheckins <= 0) {
      toast({
        title: t("fastCheckin.fullToday"),
        description: t("fastCheckin.fullTodayDesc"),
        variant: "destructive",
      });
      return;
    }

    // Check if already checked in this category today (via fast or activity)
    if (todayFastCheckins.includes(categoryId) || todayActivityCheckins.includes(categoryId)) {
      toast({
        title: t("fastCheckin.alreadyChecked"),
        description: t("fastCheckin.alreadyCheckedDesc"),
        variant: "destructive",
      });
      return;
    }

    setCheckingIn(categoryId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("checkPlus.loginRequired"),
          description: t("fastCheckin.loginRequiredDesc"),
          variant: "destructive",
        });
        return;
      }

      const today = getTodayDateThailand();

      const { error } = await supabase
        .from("fast_checkins")
        .insert({
          user_id: user.id,
          category: categoryId,
          checked_in_at: today,
        });

      if (error) throw error;

      const subCat = getSubCategoryById(categoryId);
      toast({
        title: t("fastCheckin.success"),
        description: `${t("fastCheckin.expFor")} ${subCat?.emoji} ${subCat ? getLocalizedName(subCat, language) : categoryId}`,
      });

      // Update local state
      setTodayFastCheckins(prev => [...prev, categoryId]);
      setRemainingCheckins(prev => prev - 1);
      
      onCheckInComplete?.();
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast({
        title: t("fastCheckin.error"),
        description: error.message || t("fastCheckin.cannotCheckin"),
        variant: "destructive",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  const isCheckedIn = (categoryId: string) => {
    return todayFastCheckins.includes(categoryId) || todayActivityCheckins.includes(categoryId);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return ACTIVITY_CATEGORIES;
    const q = searchQuery.trim().toLowerCase();
    return ACTIVITY_CATEGORIES
      .map((cat) => ({
        ...cat,
        subCategories: cat.subCategories.filter(
          (sub) => sub.name.toLowerCase().includes(q) || getLocalizedName(sub, language).toLowerCase().includes(q) || sub.emoji.includes(q)
        ),
      }))
      .filter((cat) => cat.subCategories.length > 0);
  }, [searchQuery, language]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-primary">
            <Zap className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Fast Check-in
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("fastCheckin.description")}
          </p>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("fastCheckin.selectToday")}</span>
            <Badge variant={remainingCheckins > 0 ? "default" : "outline"}>
              {t("fastCheckin.remainingCount").replace("{n}", String(remainingCheckins))}
            </Badge>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("checkPlus.searchActivity")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[350px] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("fastCheckin.notFound")}
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
                      const checked = isCheckedIn(sub.id);
                      const isLoading = checkingIn === sub.id;
                      
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleCheckIn(sub.id)}
                          disabled={checked || remainingCheckins <= 0 || isLoading}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            checked
                              ? "bg-primary/10 text-primary"
                              : remainingCheckins <= 0
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{sub.emoji}</span>
                            <span>{getLocalizedName(sub, language)}</span>
                          </span>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : checked ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : null}
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
