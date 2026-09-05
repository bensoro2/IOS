import { useState, useMemo } from "react";
import { Star, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityCategoriesContext } from "@/contexts/ActivityCategoriesContext";
import { AbilityHexagon } from "@/components/AbilityHexagon";
import { computeAbilityScores } from "@/constants/abilityStats";
import { EXP_PER_CHECKIN } from "@/config/defaults";


export interface JoinedActivityItem {
  category: string;
  count: number;
  exp: number;
  level: number;
  maxExp: number;
}

interface JoinedActivitiesDialogProps {
  activities: JoinedActivityItem[];
  trigger: React.ReactNode;
}

export const JoinedActivitiesDialog = ({ activities, trigger }: JoinedActivitiesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();
  const { getSubCategoryById, getCategoryBySubCategoryId } = useActivityCategoriesContext();

  const abilityScores = useMemo(() => {
    return computeAbilityScores(
      activities.map((a) => {
        const sub = getSubCategoryById(a.category);
        const parent = getCategoryBySubCategoryId(a.category);
        return {
          category: a.category,
          parentKey: parent?.id,
          names: sub ? Object.values(sub.names) : [],
          totalExp: a.count * EXP_PER_CHECKIN,
        };
      })
    );
  }, [activities, getSubCategoryById, getCategoryBySubCategoryId]);

  const sorted = useMemo(() => {
    const list = [...activities].sort(
      (a, b) => b.level - a.level || b.count - a.count
    );
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const sub = getSubCategoryById(a.category);
      const name = sub ? getLocalizedName(sub, language) : a.category;
      return name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    });
  }, [activities, searchQuery, language, getSubCategoryById]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            {t("profile.activitiesJoined")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4">
          <AbilityHexagon scores={abilityScores} size={230} />
        </div>

        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">EXP / Level</span>
          <Badge variant="default">{activities.length}</Badge>
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

        <ScrollArea className="h-[240px] px-4 pb-4">
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("profile.noActivitiesJoined")}
            </div>
          ) : (
            <div className="space-y-1">
              {sorted.map((activity) => {
                const sub = getSubCategoryById(activity.category);
                return (
                  <div
                    key={activity.category}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-xl">{sub?.emoji || "🎯"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {sub ? getLocalizedName(sub, language) : activity.category}
                        </span>
                        <span className="text-sm font-bold text-primary shrink-0">
                          Lv.{activity.level}
                        </span>
                      </div>
                      <Progress
                        value={(activity.exp / activity.maxExp) * 100}
                        className="h-1.5 bg-muted mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.exp}/{activity.maxExp} EXP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
