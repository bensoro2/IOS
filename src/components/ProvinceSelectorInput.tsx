import { useState } from "react";
import { Check, ChevronDown, Loader2, MapPin } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getSelectedCountryCode,
  getLocalizedProvinceName,
  getProvinceSearchString,
} from "@/constants/countryProvinces";
import { useProvinces } from "@/hooks/useProvinces";

interface ProvinceSelectorInputProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ProvinceSelectorInput = ({ value, onValueChange }: ProvinceSelectorInputProps) => {
  const [open, setOpen] = useState(false);
  const { language, t } = useLanguage();
  const countryCode = getSelectedCountryCode();
  const { provinces, loading } = useProvinces(countryCode);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{value ? getLocalizedProvinceName(value, language, countryCode) : t("province.selectPlaceholder")}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("province.search")} />
          <CommandList
            style={{ height: "unset", maxHeight: "300px", overflowY: "scroll" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>{t("province.notFound")}</CommandEmpty>
            )}
            <CommandGroup>
              {provinces.map((province) => (
                <CommandItem
                  key={province}
                  value={getProvinceSearchString(province, countryCode)}
                  onSelect={() => {
                    onValueChange(province);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="flex-1">{getLocalizedProvinceName(province, language, countryCode)}</span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === province ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
