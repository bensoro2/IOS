import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

/**
 * Listens for deep links:
 * 1. OAuth callback from Chrome Custom Tab (com.levelon.app://auth/callback)
 * 2. App Links from shared URLs (https://levelon.lovable.app/reels?startId=...)
 */
export const useCapacitorDeepLink = (navigate?: (path: string) => void) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: Awaited<ReturnType<typeof CapApp.addListener>> | null = null;

    const setup = async () => {
      listener = await CapApp.addListener("appUrlOpen", async ({ url }) => {
        // Close the Chrome Custom Tab (if open)
        await Browser.close().catch(() => {});

        // Handle reel deep links: https://levelon.lovable.app/reels?startId=<id>
        if (url.includes("/reels") && url.includes("startId")) {
          const parsed = new URL(url);
          const startId = parsed.searchParams.get("startId");
          if (startId) {
            if (navigate) {
              navigate(`/reels?startId=${startId}`);
            } else {
              window.location.replace(`/reels?startId=${startId}`);
            }
            return;
          }
        }

        // Handle reset-password deep link: com.levelon.app://reset-password?code=...
        if (url.includes("reset-password")) {
          const qi = url.indexOf("?");
          const hi = url.indexOf("#");
          let params = "";
          if (hi !== -1) params = url.substring(hi);
          else if (qi !== -1) params = url.substring(qi);
          if (navigate) navigate("/reset-password" + params);
          else window.location.replace("/reset-password" + params);
          return;
        }

        if (!url.includes("auth/callback")) return;

        // Extract token fragment or code param from deep link URL
        // e.g. com.levelon.app://auth/callback#access_token=... or ?code=...
        const hashIndex = url.indexOf("#");
        const queryIndex = url.indexOf("?");
        let params = "";
        if (hashIndex !== -1) params = url.substring(hashIndex);
        else if (queryIndex !== -1) params = url.substring(queryIndex);

        // Navigate WebView to /auth/callback with the tokens
        // Full reload so Supabase detectSessionInUrl processes them
        window.location.replace("/auth/callback" + params);
      });
    };

    setup();

    return () => {
      listener?.remove();
    };
  }, []);
};
