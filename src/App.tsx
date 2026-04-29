import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useSyncUserRow } from "@/hooks/useSyncUserRow";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useCapacitorDeepLink } from "@/hooks/useCapacitorDeepLink";
import { useFCMNotifications } from "@/hooks/useFCMNotifications";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import GroupChat from "./pages/GroupChat";
import DirectChat from "./pages/DirectChat";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
// import Reels from "./pages/Reels";
// import ReelsSearch from "./pages/ReelsSearch";
import Notifications from "./pages/Notifications";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivacySecurity from "./pages/PrivacySecurity";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import AuthCallback from "./pages/AuthCallback";
import TopRank from "./pages/TopRank";
import HopeCoins from "./pages/HopeCoins";

const queryClient = new QueryClient();

// Module-level flag: reset on sign-out, prevents double-redirect after callback
let oauthProcessed = false;

// If OAuth login completes but Supabase redirected to the wrong page (not /auth/callback),
// this catches the SIGNED_IN event and sends the user to /auth/callback for proper handling.
const OAuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const provider = session?.user?.app_metadata?.provider;
      const atCallback = window.location.pathname === "/auth/callback";

      // Only intercept when URL actually contains OAuth params (fresh OAuth redirect)
      const isOAuthRedirect = window.location.hash.includes("access_token") ||
                              window.location.search.includes("code=");

      if (event === "SIGNED_IN" && provider && provider !== "email" && !oauthProcessed && isOAuthRedirect) {
        oauthProcessed = true;
        if (!atCallback) {
          navigate("/auth/callback", { replace: true });
        }
        // If atCallback=true, AuthCallback already handles it — no redirect needed
      } else if (event === "SIGNED_OUT") {
        oauthProcessed = false; // reset for next login
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

const DeepLinkHandler = () => {
  const navigate = useNavigate();
  useCapacitorDeepLink(navigate);
  return null;
};

const AppSetup = () => {
  useSyncUserRow();
  useMessageNotifications();
  useFCMNotifications();
  return null;
};

const TranslatingBanner = () => {
  const { isTranslating, translateProgress } = useLanguage();
  if (!isTranslating) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-primary text-primary-foreground text-xs text-center py-1.5">
      <div
        className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200"
        style={{ width: `${Math.round(translateProgress * 100)}%` }}
      />
      <span className="relative">
        🌐 Translating UI… {Math.round(translateProgress * 100)}%
      </span>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppSetup />
            <OAuthRedirectHandler />
            <DeepLinkHandler />
            <TranslatingBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/group-chat/:id" element={<GroupChat />} />
              <Route path="/direct/:odirectId" element={<DirectChat />} />
              <Route path="/shop" element={<Shop />} />
              {/* <Route path="/reels" element={<Reels />} /> */}
              {/* <Route path="/reels/search" element={<ReelsSearch />} /> */}
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy-security" element={<PrivacySecurity />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/top-rank" element={<TopRank />} />
              <Route path="/hope-coins" element={<HopeCoins />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
