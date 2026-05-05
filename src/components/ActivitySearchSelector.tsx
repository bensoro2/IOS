import { useState } from "react";
import { Search, X, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getLocalizedName, ActivityCategory } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityCategoriesContext } from "@/contexts/ActivityCategoriesContext";

interface ActivitySearchSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ActivitySearchSelector = ({ value, onValueChange }: ActivitySearchSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<ActivityCategory | null>(null);
  const { language, t } = useLanguage();
  const { categories, getSubCategoryById } = useActivityCategoriesContext();
  const selectedActivity = getSubCategoryById(value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
      setSelectedParent(null);
    }
  };

  const handleSelect = (subId: string) => {
    onValueChange(subId);
    setOpen(false);
    setSearch("");
    setSelectedParent(null);
  };

  // When searching, show flat results across all categories
  const searchResults = search.trim()
    ? categories.flatMap((cat) =>
        cat.subCategories
          .filter((sub) => {
            const q = search.toLowerCase();
            return (
              sub.name.toLowerCase().includes(q) ||
              getLocalizedName(sub, language).toLowerCase().includes(q)
            );
          })
          .map((sub) => ({ ...sub, parentName: getLocalizedName(cat, language), parentEmoji: cat.emoji }))
      )
    : [];

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("home.searchActivities")}
            className="pl-10 pr-10 bg-card border-border cursor-pointer"
            value={selectedActivity ? `${selectedActivity.emoji} ${getLocalizedName(selectedActivity, language)}` : ""}
            readOnly
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-hidden" align="start">
        {/* Search input */}
        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedParent(null); }}
            placeholder={t("home.typeToSearch")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {/* Search results */}
          {search.trim() ? (
            searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("home.noActivitiesFound")}</p>
            ) : (
              <div>
                {searchResults.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect(sub.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-lg">{sub.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getLocalizedName(sub, language)}</p>
                      <p className="text-xs text-muted-foreground">{sub.parentEmoji} {sub.parentName}</p>
                    </div>
                    {value === sub.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            )
          ) : selectedParent ? (
            /* Sub-category list */
            <div>
              <button
                onClick={() => setSelectedParent(null)}
                className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{getLocalizedName(selectedParent, language)}</span>
              </button>
              {selectedParent.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelect(sub.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-lg">{sub.emoji}</span>
                  <span className="flex-1 text-sm">{getLocalizedName(sub, language)}</span>
                  {value === sub.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          ) : (
            /* Parent category list */
            <div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedParent(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{getLocalizedName(cat, language)}</span>
                  <span className="text-xs text-muted-foreground mr-1">{cat.subCategories.length}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
