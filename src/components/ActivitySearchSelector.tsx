import { useState } from "react";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ACTIVITY_CATEGORIES, getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActivitySearchSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ActivitySearchSelector = ({ value, onValueChange }: ActivitySearchSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { language, t } = useLanguage();
  const selectedActivity = getSubCategoryById(value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
           <CommandInput placeholder={t("home.typeToSearch")} />
           <CommandList>
             <CommandEmpty>{t("home.noActivitiesFound")}</CommandEmpty>
            {ACTIVITY_CATEGORIES.map((category) => (
              <CommandGroup 
                key={category.id} 
                heading={
                  <span className="flex items-center gap-2">
                    <span>{category.emoji}</span>
                    <span>{getLocalizedName(category, language)}</span>
                  </span>
                }
              >
                {category.subCategories.map((sub) => {
                  const localName = getLocalizedName(sub, language);
                  return (
                    <CommandItem
                      key={sub.id}
                      value={`${sub.name} ${localName} ${sub.emoji}`}
                      onSelect={() => {
                        onValueChange(sub.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-2 flex-1">
                        <span>{sub.emoji}</span>
                        <span>{localName}</span>
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === sub.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
