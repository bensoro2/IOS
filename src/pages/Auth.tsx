import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { notifyToast } from "@/lib/notifyToast";
import { Eye, EyeOff } from "lucide-react";
import levelonLogo from "@/assets/image.png";
import { APP_NAME } from "@/config/defaults";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { syncUserRow } from "@/hooks/useSyncUserRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { setSelectedCountryCode, getSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";
import { getAllCountries, getAllLanguages } from "@/utils/intlData";

const Auth = () => {
  const { t, language, setLanguage } = useLanguage();
  const [country, setCountry] = useState(getSelectedCountryCode());
  const countries = useMemo(() => getAllCountries(language), [language]);
  const [loading, setLoading] = useState(false);

  const handleCountryChange = (code: string) => {
    setCountry(code);
    setSelectedCountryCode(code);
    localStorage.setItem("selected_province", getDefaultProvince(code));
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [suspendedUserId, setSuspendedUserId] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReactivateAccount = async () => {
    if (!suspendedUserId) return;
    setReactivating(true);

    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", suspendedUserId);

    if (error) {
      toast({
        title: t("common.error"),
        description: t("auth.cannotReactivate"),
        variant: "destructive",
      });
    } else {
      // Sync user row before navigating
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try { await syncUserRow(session.user); } catch { /* ignore */ }
      }
      notifyToast(t("auth.reactivateSuccess"), {
        description: t("auth.welcomeBack"),
      });
      navigate("/");
    }
    setReactivating(false);
    setShowReactivateDialog(false);
    setSuspendedUserId(null);
  };

  const handleCancelReactivate = async () => {
    await supabase.auth.signOut();
    setShowReactivateDialog(false);
    setSuspendedUserId(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("status")
          .eq("id", data.user.id)
          .maybeSingle();

        if (userData?.status === "suspended") {
          setSuspendedUserId(data.user.id);
          setShowReactivateDialog(true);
          setLoading(false);
          return;
        }

        try {
          await syncUserRow(data.user);
        } catch {
          // ignore
        }
      }
      setSelectedCountryCode(country);
      localStorage.setItem("selected_province", getDefaultProvince(country));
      notifyToast(t("auth.loginSuccess"), {
        description: t("auth.welcomeBack"),
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSelectedCountryCode(country);
      localStorage.setItem("selected_province", getDefaultProvince(country));
      notifyToast(t("auth.registerSuccess"), {
        description: t("auth.checkEmail"),
      });
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // Native app: เปิด OAuth ใน Chrome Custom Tab แล้วรับ deep link กลับ
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: "com.levelon.app://auth/callback",
            skipBrowserRedirect: true,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
        if (data?.url) await Browser.open({ url: data.url });
      } else {
        // Web: redirect ปกติ
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({
        title: t("auth.enterEmail"),
        description: t("auth.enterEmailHint"),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: Capacitor.isNativePlatform()
        ? "com.levelon.app://reset-password"
        : `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      notifyToast(t("auth.resetLinkSent"), {
        description: t("auth.checkEmailForReset"),
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="default min-h-screen bg-gradient-to-b from-primary via-primary/80 to-primary/40 flex items-center justify-center p-4 text-foreground">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <img src={levelonLogo} alt={APP_NAME} className="w-16 h-16 object-contain" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-1">
          Levelon
        </h1>
        <p className="text-sm text-center text-muted-foreground mb-4">{t("auth.welcome")}</p>

        {/* Language & Country selectors */}
        <div className="flex gap-2 mb-6">
          <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {getAllLanguages().map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
            <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? t("auth.loginLoading") : t("auth.login")}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">{t("auth.displayName")}</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder={t("auth.displayNamePlaceholder")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.passwordMin")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? t("auth.registerLoading") : t("auth.register")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("auth.orDivider")}</span>
          </div>
        </div>

        {/* Google Login */}
        <Button
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? t("auth.oauthLoading") : t("auth.loginWithGoogle")}
        </Button>

        {/* Facebook Login */}
        <Button
          onClick={() => handleOAuthLogin("facebook")}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#1877F2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          {loading ? t("auth.oauthLoading") : t("auth.loginWithFacebook")}
        </Button>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          {t("auth.terms")}{" "}
          <a href="/terms" className="text-primary hover:underline">
            {t("auth.termsLink")}
          </a>
          {" "}{t("auth.privacyAnd")}{" "}
          <a href="/privacy-policy" className="text-primary hover:underline">
            {t("auth.privacyLink")}
          </a>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForgotPassword(false)}>
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground">{t("auth.forgotPasswordTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.forgotPasswordDesc")}</p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t("auth.email")}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForgotPassword(false)}>
                {t("common.cancel")}
              </Button>
              <Button className="flex-1" onClick={handleForgotPassword} disabled={loading}>
                {loading ? t("auth.sendLinkLoading") : t("auth.sendLink")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Account Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.suspendedTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.suspendedDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReactivate} disabled={reactivating}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivateAccount} disabled={reactivating}>
              {reactivating ? t("common.processing") : t("auth.reactivateAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
