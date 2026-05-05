import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setSelectedParent(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => setOpen(true);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setSearch("");
    setSelectedParent(null);
    inputRef.current?.focus();
  };

  const handleSelect = (subId: string) => {
    onValueChange(subId);
    setOpen(false);
    setSearch("");
    setSelectedParent(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedParent(null);
    if (!open) setOpen(true);
  };

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

  // Display value in input
  const inputValue = open
    ? search
    : selectedActivity
    ? `${selectedActivity.emoji} ${getLocalizedName(selectedActivity, language)}`
    : "";

  return (
    <div ref={containerRef} className="relative">
      {/* Single search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={t("home.searchActivities")}
          className="w-full h-10 pl-10 pr-10 rounded-md border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {(value || search) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {search.trim() ? (
              /* Search results */
              searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("home.noActivitiesFound")}</p>
              ) : (
                searchResults.map((sub) => (
                  <button
                    key={sub.id}
                    onMouseDown={(e) => e.preventDefault()}
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
                ))
              )
            ) : selectedParent ? (
              /* Sub-category list */
              <>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedParent(null)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{getLocalizedName(selectedParent, language)}</span>
                </button>
                {selectedParent.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(sub.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-lg">{sub.emoji}</span>
                    <span className="flex-1 text-sm">{getLocalizedName(sub, language)}</span>
                    {value === sub.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </>
            ) : (
              /* Parent category list */
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedParent(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{getLocalizedName(cat, language)}</span>
                  <span className="text-xs text-muted-foreground mr-1">{cat.subCategories.length}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
