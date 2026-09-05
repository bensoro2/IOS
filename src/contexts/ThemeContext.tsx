import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomColors, SIDEBAR_MIRROR, readCustomColors, CUSTOM_THEME_KEY } from "@/lib/themeColors";

export type ThemeName = "default" | "dark-dandelion" | "cloud-sky" | "pink-silk" | "violet-white" | "red-pink" | "blue-yellow" | "custom";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  setOverrideTheme: (theme: ThemeName | null) => void;
  customColors: CustomColors;
  saveCustomColors: (colors: CustomColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const PREMIUM_THEMES: ThemeName[] = ["dark-dandelion", "cloud-sky", "pink-silk", "violet-white", "red-pink", "blue-yellow", "custom"];

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as ThemeName) || "default";
  });
  const [overrideTheme, setOverrideTheme] = useState<ThemeName | null>(null);
  const [customColors, setCustomColors] = useState<CustomColors>(() => readCustomColors());
  // Timestamp of the last local (user-initiated) theme change. Any DB result that
  // was requested before it is stale and must never overwrite the user's choice.
  const localChangeAtRef = useRef(0);

  const activeTheme = overrideTheme || theme;

  const checkPremiumAndResetTheme = useCallback(async (currentTheme: ThemeName) => {
    // Only check if using a premium theme
    if (!PREMIUM_THEMES.includes(currentTheme)) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Not logged in - reset to default if using premium theme
      setThemeState("default");
      return;
    }

    const { data: premiumData } = await supabase
      .from("user_premium")
      .select("premium_until, plan_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasThemes = premiumData?.premium_until 
      && new Date(premiumData.premium_until) > new Date()
      && premiumData.plan_type === "gold";

    // If user doesn't have theme access but is using a premium theme, reset
    if (!hasThemes) {
      setThemeState("default");
    }
  }, []);

  // Load theme from DB on login
  const loadThemeFromDB = useCallback(async () => {
    const startedAt = Date.now();
    const isStale = () => localChangeAtRef.current > startedAt;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    const { data } = await supabase
      .from("users")
      .select("theme, theme_custom")
      .eq("id", user.id)
      .maybeSingle();

    if (isStale()) return;

    if (data?.theme_custom && typeof data.theme_custom === "object") {
      const dbColors = { ...readCustomColors(), ...(data.theme_custom as CustomColors) };
      setCustomColors(dbColors);
      localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(dbColors));
    }

    if (data?.theme) {
      const dbTheme = data.theme as ThemeName;
      // If it's a premium theme, verify access
      if (PREMIUM_THEMES.includes(dbTheme)) {
        const { data: premiumData } = await supabase
          .from("user_premium")
          .select("premium_until, plan_type")
          .eq("user_id", user.id)
          .maybeSingle();

        const hasThemes = premiumData?.premium_until
          && new Date(premiumData.premium_until) > new Date()
          && premiumData.plan_type === "gold";

        if (isStale()) return;
        const next = hasThemes ? dbTheme : "default";
        setThemeState((prev) => (prev === next ? prev : next));
        localStorage.setItem("app-theme", next);
      } else {
        setThemeState((prev) => (prev === dbTheme ? prev : dbTheme));
        localStorage.setItem("app-theme", dbTheme);
      }
    }
  }, []);


  // Load theme from DB on mount
  useEffect(() => {
    loadThemeFromDB();
  }, [loadThemeFromDB]);

  // Listen for auth changes - reload theme from DB
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadThemeFromDB();
      } else if (event === "SIGNED_OUT") {
        localChangeAtRef.current = Date.now();
        setThemeState("default");
        localStorage.setItem("app-theme", "default");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadThemeFromDB]);

  // Apply theme class to document synchronously (before paint) to avoid flicker
  useLayoutEffect(() => {
    const root = document.documentElement;
    const classes = ["default", "dark-dandelion", "cloud-sky", "pink-silk", "violet-white", "red-pink", "blue-yellow", "custom"];
    const next = activeTheme === "custom" ? ["default", "custom"] : [activeTheme];
    classes.forEach((c) => {
      if (!next.includes(c)) root.classList.remove(c);
    });
    next.forEach((c) => root.classList.add(c));

    if (activeTheme === "custom") {
      Object.entries(customColors).forEach(([token, value]) => {
        root.style.setProperty(`--${token}`, value);
      });
      Object.entries(SIDEBAR_MIRROR).forEach(([token, source]) => {
        if (customColors[source]) root.style.setProperty(`--${token}`, customColors[source]);
      });
    } else {
      Object.keys(customColors).forEach((token) => root.style.removeProperty(`--${token}`));
      Object.keys(SIDEBAR_MIRROR).forEach((token) => root.style.removeProperty(`--${token}`));
    }

    if (!overrideTheme) {
      localStorage.setItem("app-theme", activeTheme);
    }
  }, [activeTheme, overrideTheme, customColors]);

  const saveCustomColors = async (colors: CustomColors) => {
    localChangeAtRef.current = Date.now();
    setCustomColors(colors);
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(colors));
    // Persist to DB so all devices on the same account share the same colors
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ theme_custom: colors }).eq("id", user.id);
    }
  };


  const setTheme = async (newTheme: ThemeName) => {
    localChangeAtRef.current = Date.now();
    setThemeState(newTheme);
    // Persist locally right away so a reload/navigation never shows the old theme
    localStorage.setItem("app-theme", newTheme);
    // Persist to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ theme: newTheme }).eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setOverrideTheme, customColors, saveCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
};