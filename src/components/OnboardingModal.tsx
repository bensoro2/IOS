import { useState, useEffect, useMemo } from "react";
import { Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { setSelectedCountryCode, getSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";
import { getAllCountries, getAllLanguages } from "@/utils/intlData";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_KEY = "onboarding_completed";

export const OnboardingModal = () => {
  const { language, setLanguage, t } = useLanguage();
  const [show, setShow] = useState(false);
  const [country, setCountry] = useState(getSelectedCountryCode());

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setShow(true);
    });

    // Listen for sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !localStorage.getItem(ONBOARDING_KEY)) {
        setShow(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Recompute country list whenever language changes (names will be in new locale)
  const countries = useMemo(() => getAllCountries(language), [language]);

  const handleConfirm = () => {
    setSelectedCountryCode(country);
    localStorage.setItem("selected_province", getDefaultProvince(country));
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌏</div>
          <h2 className="text-xl font-bold text-foreground">{t("onboarding.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.subtitle")}</p>
        </div>

        <div className="space-y-4">
          {/* Language selector */}
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium">{t("settings.language")}</span>
            <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-[10000]">
                {getAllLanguages().map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country selector */}
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-medium">{t("settings.country")}</span>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto z-[10000]">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-6 h-11 text-base">
          {t("onboarding.confirm")}
        </Button>
      </div>
    </div>
  );
};
