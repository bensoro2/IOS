import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeName = "default" | "dark-dandelion" | "cloud-sky" | "pink-silk";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  setOverrideTheme: (theme: ThemeName | null) => void;
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

const PREMIUM_THEMES: ThemeName[] = ["dark-dandelion", "cloud-sky", "pink-silk"];

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as ThemeName) || "default";
  });
  const [overrideTheme, setOverrideTheme] = useState<ThemeName | null>(null);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle();

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

        if (hasThemes) {
          setThemeState(dbTheme);
        } else {
          setThemeState("default");
        }
      } else {
        setThemeState(dbTheme);
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
        setThemeState("default");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadThemeFromDB]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove("default", "dark-dandelion", "cloud-sky", "pink-silk");
    document.documentElement.classList.add(activeTheme);
    if (!overrideTheme) {
      localStorage.setItem("app-theme", activeTheme);
    }
  }, [activeTheme, overrideTheme]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    // Persist to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ theme: newTheme }).eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setOverrideTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};