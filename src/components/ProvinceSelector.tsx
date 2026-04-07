import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getSelectedCountryCode,
  getLocalizedProvinceName,
} from "@/constants/countryProvinces";
import { useProvinces } from "@/hooks/useProvinces";

// Keep backward-compatible export
export const getLocalizedProvince = (nativeName: string, language: string): string =>
  getLocalizedProvinceName(nativeName, language);

interface ProvinceSelectorProps {
  selectedProvince: string;
  onSelect: (province: string) => void;
}

export const ProvinceSelector = ({ selectedProvince, onSelect }: ProvinceSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { language, t } = useLanguage();
  const countryCode = getSelectedCountryCode();
  const { provinces, loading, isDynamic } = useProvinces(countryCode);

  // Auto-select first province when provinces load and current selection is invalid
  useEffect(() => {
    if (!loading && provinces.length > 0 && !provinces.includes(selectedProvince)) {
      onSelect(provinces[0]);
      localStorage.setItem("selected_province", provinces[0]);
    }
  }, [provinces, loading, selectedProvince, onSelect]);

  const handleSelect = (province: string) => {
    onSelect(province);
    setOpen(false);
  };

  // For dynamic countries, just show the name as-is
  const displayName = isDynamic
    ? (selectedProvince || t("home.selectProvince"))
    : (getLocalizedProvinceName(selectedProvince, language, countryCode) || selectedProvince || t("home.selectProvince"));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1 text-foreground">
          <MapPin className="w-5 h-5" />
          <span className="font-medium">{displayName}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-left">{t("home.selectProvince")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full py-4">
          <div className="space-y-1">
            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {provinces.map((province) => (
              <button
                key={province}
                onClick={() => handleSelect(province)}
                className={`w-full py-3 text-center transition-colors ${
                  selectedProvince === province
                    ? "text-foreground font-semibold bg-accent rounded-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md"
                }`}
              >
                {isDynamic ? province : getLocalizedProvinceName(province, language, countryCode)}
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
