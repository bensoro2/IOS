import { useState, useMemo } from "react";
import { Sparkles, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { getLocalizedName, matchesActivityQuery } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityCategoriesContext } from "@/contexts/ActivityCategoriesContext";

interface CategoryPickerDialogProps {
  value: string;
  onValueChange: (value: string) => void;
  trigger: React.ReactNode;
}

export const CategoryPickerDialog = ({ value, onValueChange, trigger }: CategoryPickerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, t } = useLanguage();
  const { categories } = useActivityCategoriesContext();

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => {
        const parentMatch = matchesActivityQuery(cat, q);
        return {
          ...cat,
          subCategories: parentMatch
            ? cat.subCategories
            : cat.subCategories.filter((sub) => matchesActivityQuery(sub, q)),
        };
      })
      .filter((cat) => cat.subCategories.length > 0);
  }, [searchQuery, categories]);



  const select = (id: string) => {
    onValueChange(id);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("home.selectActivity")}
          </DialogTitle>
        </DialogHeader>

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
          {!searchQuery.trim() && (
            <button
              onClick={() => select("")}
              className={`w-full flex items-center justify-between p-3 rounded-lg mb-3 transition-colors ${
                value === "" ? "bg-primary/10 text-primary" : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{t("common.all") || "All"}</span>
              </span>
              {value === "" && <Check className="w-4 h-4 text-primary" />}
            </button>
          )}


          {filteredCategories.length === 0 ? (
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
                      const active = value === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => select(sub.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            active ? "bg-primary/10 text-primary" : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{sub.emoji}</span>
                            <span>{getLocalizedName(sub, language)}</span>
                          </span>
                          {active && <Check className="w-4 h-4 text-primary" />}
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
