import { useTheme, ThemeName } from "@/contexts/ThemeContext";
import { Palette, ChevronRight, Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { toast } from "sonner";
import CustomThemeDialog from "@/components/CustomThemeDialog";
 
interface ThemeOption {
  id: ThemeName;
  name: string;
  colors: {
    bg: string;
    accent: string;
  };
  requiresPremium?: boolean;
}
 
const themes: ThemeOption[] = [
  {
    id: "dark-dandelion",
    name: "Dark Dandelion",
    colors: { bg: "hsl(240 10% 12%)", accent: "hsl(45 90% 55%)" },
    requiresPremium: true,
  },
  {
    id: "cloud-sky",
    name: "Cloud Sky",
    colors: { bg: "hsl(200 30% 85%)", accent: "hsl(200 80% 50%)" },
    requiresPremium: true,
  },
  {
    id: "pink-silk",
    name: "Pink Silk",
    colors: { bg: "hsl(340 30% 80%)", accent: "hsl(340 75% 55%)" },
    requiresPremium: true,
  },
  {
    id: "violet-white",
    name: "Violet Noir",
    colors: { bg: "hsl(270 60% 10%)", accent: "hsl(0 0% 100%)" },
    requiresPremium: true,
  },
  {
    id: "red-pink",
    name: "Ruby Night",
    colors: { bg: "hsl(340 60% 10%)", accent: "hsl(340 80% 90%)" },
    requiresPremium: true,
  },
  {
    id: "blue-yellow",
    name: "Midnight Blue",
    colors: { bg: "hsl(220 70% 20%)", accent: "hsl(48 100% 55%)" },
    requiresPremium: true,
  },
];
 
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const { t } = useLanguage();
  const { hasThemes } = usePremiumStatus();

  const currentTheme = theme === "custom" ? { name: "Custom" } : themes.find((t) => t.id === theme);
 
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-left">{t("theme.title")}</span>
          <span className="text-sm text-muted-foreground">{currentTheme?.name}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {t("theme.title")}
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          {t("theme.description")}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-2">
          {themes.map((themeOption) => {
            const isLocked = !!themeOption.requiresPremium && !hasThemes;
            return (
              <button
                key={themeOption.id}
                onClick={() => {
                  if (isLocked) {
                    toast.error(t("theme.premiumRequired") || "ต้องสมัคร Gold Plan เพื่อใช้ธีมนี้");
                    return;
                  }
                  setTheme(themeOption.id);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-end rounded-xl h-28 overflow-hidden transition-all",
                  theme === themeOption.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isLocked && "opacity-70 cursor-not-allowed"
                )}
                style={{ background: themeOption.colors.bg }}
              >
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white/80" />
                  </div>
                )}
                {theme === themeOption.id && !isLocked && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
                <div
                  className="w-full py-2 px-3 text-center text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(to top, ${themeOption.colors.accent}cc, ${themeOption.colors.accent}40)`,
                  }}
                >
                  {themeOption.name}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              setTheme("default");
              setOpen(false);
            }}
            className={cn(
              "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg",
              theme === "default" && "bg-muted text-foreground"
            )}
          >
            Standard
          </button>

          <button
            onClick={() => {
              if (!hasThemes) {
                toast.error(t("theme.premiumRequired") || "ต้องสมัคร Gold Plan เพื่อใช้ธีมนี้");
                return;
              }
              setCustomOpen(true);
            }}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors",
              theme === "custom" && "bg-primary/10"
            )}
          >
            {!hasThemes ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            Custom
          </button>
        </div>
      </DialogContent>

      <CustomThemeDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onSaved={() => setOpen(false)}
      />
    </Dialog>
  );
};
 
export default ThemeSelector;
