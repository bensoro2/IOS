import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { ACTIVITY_CATEGORIES, getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActivitySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ActivitySelector = ({ value, onValueChange }: ActivitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const { language, t } = useLanguage();
  const selectedActivity = getSubCategoryById(value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedActivity ? (
            <span className="flex items-center gap-2">
              <span>{selectedActivity.emoji}</span>
              <span>{getLocalizedName(selectedActivity, language)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t("activitySelector.placeholder")}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("home.searchActivities")} />
          <CommandList className="max-h-[260px] overflow-y-auto">
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
