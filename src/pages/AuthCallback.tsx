import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { syncUserRow } from "@/hooks/useSyncUserRow";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import levelonLogo from "@/assets/image.png";
import { APP_NAME } from "@/config/defaults";
import { popRedirectUrl } from "@/utils/authRedirect";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [openingApp, setOpeningApp] = useState(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState("com.levelon.app://");

  useEffect(() => {
    let done = false;

    const handleSession = async (session: Session) => {
      if (done) return;
      done = true;

      try {
        await syncUserRow(session.user);
      } catch {
        // silent
      }

      const { data: userData } = await supabase
        .from("users")
        .select("status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (userData?.status === "suspended") {
        await supabase.auth.signOut();
        toast({
          title: t("auth.accountSuspendedTitle"),
          description: t("auth.accountSuspendedDesc"),
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Native app: ไปหน้าหลักตามปกติ
      if (Capacitor.isNativePlatform()) {
        navigate(popRedirectUrl());
        return;
      }

      // Web + OAuth provider → แสดงปุ่มเปิด native app พร้อมส่ง token
      const provider = session.user.app_metadata?.provider;
      if (provider && provider !== "email") {
        const url = `com.levelon.app://auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&expires_in=${session.expires_in}`;
        setDeepLinkUrl(url);
        setOpeningApp(true);
        return;
      }

      navigate(popRedirectUrl());
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleSession(session);
      } else if ((event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") && !session && !done) {
        done = true;
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !done) handleSession(session);
    });

    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        toast({
          title: t("auth.loginFailedTitle"),
          description: t("auth.loginFailedDesc"),
          variant: "destructive",
        });
        navigate("/auth");
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (openingApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 px-6">
          <img src={levelonLogo} alt={APP_NAME} className="w-16 h-16 object-contain mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-semibold">{t("auth.loginSuccess")}</p>
            <p className="text-muted-foreground text-sm">{t("auth.openAppDesc")}</p>
          </div>
          <a
            href={deepLinkUrl}
            className="block w-full bg-primary text-white py-3 px-6 rounded-xl font-medium text-center"
          >
            {t("auth.openApp")}
          </a>
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground text-sm underline"
          >
            {t("auth.useWeb")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">{t("auth.signingIn")}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
