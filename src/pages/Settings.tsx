import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  User,
  Shield,
  Bell,
  Globe,
  Languages,
  Ban,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Trash2,
  Copy,
  Check as CheckIcon,
  MapPin,
} from "lucide-react";
import { getSelectedCountryCode, setSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";
import { getAllCountries, getAllLanguages } from "@/utils/intlData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BlockedUsersDialog from "@/components/BlockedUsersDialog";
import EditProfileDialog from "@/components/EditProfileDialog";
import ThemeSelector from "@/components/ThemeSelector";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { toast } from "sonner";
import { useNotificationPreference } from "@/hooks/useNotificationPreference";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PlanType } from "@/hooks/usePremiumStatus";
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

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage: setAppLanguage, t } = useLanguage();
  const { notificationsEnabled, setNotificationsEnabled } = useNotificationPreference();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();
  const [promoCode, setPromoCode] = useState("");
  const [blockedUsers, setBlockedUsers] = useState(0);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const [userCode, setUserCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [checkPlusPoints, setCheckPlusPoints] = useState(0);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAvatar, setShowAvatar] = useState(() => {
    const saved = localStorage.getItem("show_avatar");
    return saved !== null ? saved === "true" : true;
  });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Verify PromptPay payment on return from Stripe
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const checkout = searchParams.get("checkout");
    if (checkout === "success" && sessionId) {
      const verifyPayment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { session_id: sessionId },
          });
          if (error) throw error;
          if (data?.success) {
            toast.success(t("toast.paymentSuccess"));
          } else {
            toast.error(data?.message || t("toast.paymentFail"));
          }
        } catch (err: any) {
          console.error("Verify payment error:", err);
          toast.error(t("toast.paymentError"));
        }
        // Clean URL params
        setSearchParams({});
      };
      verifyPayment();
    } else if (checkout === "success") {
      toast.success(t("toast.subscriptionSuccess"));
      setSearchParams({});
    } else if (checkout === "cancelled") {
      toast.info(t("toast.paymentCancelled"));
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase.from("users").select("user_code, check_plus_points").eq("id", session.user.id).maybeSingle().then(({ data }) => {
          setUserCode((data as any)?.user_code || null);
          setCheckPlusPoints((data as any)?.check_plus_points ?? 0);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch blocked users count on mount
  useEffect(() => {
    const fetchBlockedCount = async () => {
      if (!user) return;

      const { count } = await supabase
        .from("blocks")
        .select("*", { count: "exact", head: true })
        .eq("blocker_id", user.id);

      setBlockedUsers(count || 0);
    };
    fetchBlockedCount();
  }, [user]);

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) {
      toast.error(t("toast.enterCode"));
      return;
    }

    if (!user) {
      toast.error(t("toast.loginFirst"));
      return;
    }

    setIsRedeemingCode(true);
    try {
      // Try user code first
      // Try redeeming as user code via secure RPC
      const { data: rpcResult } = await supabase.rpc("redeem_user_code", { p_code: promoCode.trim() });
      const result = rpcResult as { error?: string; success?: boolean } | null;

      if (result) {
        if (result.error === "not_found") {
          // Not a user code, fall through to promo code check
        } else if (result.error === "self_redeem") {
          toast.error(t("toast.selfRedeem"));
          return;
        } else if (result.error === "already_redeemed") {
          toast.error(t("toast.alreadyRedeemed"));
          return;
        } else if (result.success) {
          setPromoCode("");
          toast.success(t("toast.codeSent"));
          return;
        }
      }

      // Find the promo code
      const { data: codeData, error: codeError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!codeData) {
        toast.error(t("toast.codeInvalid"));
        return;
      }

      // Check if code has reached max uses
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        toast.error(t("toast.codeMaxUses"));
        return;
      }

      // Check if user already redeemed this code
      const { data: existingRedemption } = await supabase
        .from("code_redemptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_id", codeData.id)
        .maybeSingle();

      if (existingRedemption) {
        toast.error(t("toast.codeUsed"));
        return;
      }

      // Handle check_plus type - give points instead of premium
      if (codeData.plan_type === "check_plus") {
        const { data: userData } = await supabase
          .from("users")
          .select("check_plus_points")
          .eq("id", user.id)
          .single();

        const currentPoints = userData?.check_plus_points || 0;
        const { error: updateError } = await supabase
          .from("users")
          .update({ check_plus_points: currentPoints + 5 })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // Create redemption record after successful update
        await supabase
          .from("code_redemptions")
          .insert({ user_id: user.id, code_id: codeData.id });

        setPromoCode("");
        setCheckPlusPoints(currentPoints + 5);
        toast.success(t("toast.checkPlusRedeemSuccess"));
        window.location.reload();
        return;
      }

      // Create redemption record for premium codes
      const { error: redemptionError } = await supabase
        .from("code_redemptions")
        .insert({
          user_id: user.id,
          code_id: codeData.id,
        });

      if (redemptionError) throw redemptionError;

      // Calculate new premium end date
      const now = new Date();
      let newPremiumUntil: Date;
      const planType = codeData.plan_type as PlanType;

      // Check current premium status
      const { data: currentPremium } = await supabase
        .from("user_premium")
        .select("premium_until, plan_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentPremium && new Date(currentPremium.premium_until) > now) {
        newPremiumUntil = new Date(currentPremium.premium_until);
        newPremiumUntil.setDate(newPremiumUntil.getDate() + codeData.premium_days);
      } else {
        newPremiumUntil = new Date(now);
        newPremiumUntil.setDate(newPremiumUntil.getDate() + codeData.premium_days);
      }

      // Upsert premium status with plan_type
      const { error: premiumError } = await supabase
        .from("user_premium")
        .upsert({
          user_id: user.id,
          premium_until: newPremiumUntil.toISOString(),
          plan_type: planType,
        }, {
          onConflict: "user_id",
        });

      if (premiumError) throw premiumError;

      setPromoCode("");
      const planLabel = planType === "gold" ? "Gold" : "Pro";
      toast.success(t("toast.premiumRedeemSuccess").replace("{plan}", planLabel).replace("{days}", String(codeData.premium_days)));
      
      // Reload page to refresh premium status
      window.location.reload();
    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast.error(t("toast.codeError"));
    } finally {
      setIsRedeemingCode(false);
    }
  };
 
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSuspendAccount = async () => {
    setIsSuspending(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: "suspended" })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("toast.accountSuspended"));
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Error suspending account:", error);
      toast.error(t("toast.suspendError"));
    } finally {
      setIsSuspending(false);
      setShowSuspendDialog(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      toast.success(t("toast.accountDeleted"));
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error?.message || t("toast.deleteError"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate("/profile")} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("settings.title")}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-8">
        {/* User Info */}
        <div className="flex items-center gap-4 py-2">
          <Avatar className="w-14 h-14 border-2 border-primary">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-lg font-semibold">{displayName}</span>
        </div>

        {/* บัญชี (Account) Section */}
        <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground px-1 mb-2">{t("settings.account")}</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <button onClick={() => setShowEditProfile(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{t("settings.editProfile")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="h-px bg-border mx-4" />
            <button onClick={() => navigate("/privacy-security")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{t("settings.privacySecurity")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* การตั้งค่า (Settings) Section */}
        <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground px-1 mb-2">{t("settings.settings")}</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <span>{t("settings.notifications")}</span>
                {pushSupported && pushPermission === "denied" && (
                  <p className="text-xs text-destructive mt-0.5">{t("settings.pushBlocked")}</p>
                )}
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={async (checked) => {
                  setNotificationsEnabled(checked);
                  if (pushSupported && pushPermission !== "denied") {
                    if (checked) {
                      await subscribePush();
                    } else {
                      await unsubscribePush();
                    }
                  }
                  toast.success(checked ? t("settings.notifOn") : t("settings.notifOff"));
                }}
              />
            </div>
            <div className="h-px bg-border mx-4" />
            <div className="flex items-center gap-3 px-4 py-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1">{t("settings.country")}</span>
              <Select value={getSelectedCountryCode()} onValueChange={(val) => {
                setSelectedCountryCode(val);
                localStorage.setItem("selected_province", getDefaultProvince(val));
                window.location.reload();
              }}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {getAllCountries(language).map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-px bg-border mx-4" />
            <div className="flex items-center gap-3 px-4 py-3">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1">{t("settings.language")}</span>
              <Select value={language} onValueChange={(val) => setAppLanguage(val as any)}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
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
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="space-y-1">
          <div className="bg-card rounded-xl overflow-hidden">
            <div className="px-4 py-3">
              <ThemeSelector />
            </div>
          </div>
        </div>


        {/* สมัครสมาชิก (Subscription) Section */}
        {/* <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground px-1 mb-2">{t("settings.subscription")}</h3>
          <div className="bg-card rounded-xl p-4">
            <SubscriptionPlans />
          </div>
        </div> */}

        {/* โค้ดสิทธิพิเศษ (Promo Code) Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-sm text-muted-foreground">{t("settings.promoCode")}</h3>
            <span className="text-xs text-muted-foreground">{t("settings.checkPlusPoints")}: <span className="font-semibold text-primary">{checkPlusPoints}</span></span>
          </div>
          <div className="bg-card rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder=""
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-muted border-0 text-sm"
                disabled={isRedeemingCode}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRedeemCode}
                disabled={isRedeemingCode || !promoCode.trim()}
              >
                {isRedeemingCode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("settings.redeemCode")
                )}
              </Button>
            </div>
            {userCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <span className="text-xs text-muted-foreground">{t("settings.yourCode")}</span>
                <span className="font-mono text-sm font-semibold tracking-widest">{userCode}</span>
                {codeCopied
                  ? <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>

        {/* ผู้ใช้ที่บล็อก (Blocked Users) Section */}
        <div className="bg-card rounded-xl overflow-hidden">
           <button 
             onClick={() => setShowBlockedDialog(true)}
             className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
           >
            <Ban className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">{t("settings.blockedUsers")}</span>
            <span className="text-muted-foreground">{blockedUsers}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>


        {/* Suspend & Delete Account Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1 gap-1.5 text-sm border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setShowSuspendDialog(true)}
          >
            <AlertTriangle className="w-4 h-4" />
            {t("settings.suspendAccount")}
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-1.5 text-sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            {t("settings.deleteAccount")}
          </Button>
        </div>

        {/* Logout Button */}
        <Button 
          variant="destructive" 
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
           {t("settings.logout")}
        </Button>
       
         {/* Blocked Users Dialog */}
         <BlockedUsersDialog
           open={showBlockedDialog}
           onOpenChange={setShowBlockedDialog}
           onCountChange={setBlockedUsers}
         />
         <EditProfileDialog
           open={showEditProfile}
           onOpenChange={setShowEditProfile}
           user={user}
         />

         {/* Delete Account Dialog */}
         <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
               <AlertDialogDescription>
                 {t("settings.deleteConfirmDesc")}
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel disabled={isDeleting}>{t("settings.deleteCancel")}</AlertDialogCancel>
               <AlertDialogAction
                 onClick={handleDeleteAccount}
                 disabled={isDeleting}
                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                 {isDeleting ? (
                   <Loader2 className="w-4 h-4 animate-spin mr-2" />
                 ) : null}
                 {t("settings.deleteConfirm")}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>

         {/* Suspend Account Dialog */}
         <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
           <AlertDialogContent>
             <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.suspendConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.suspendConfirmDesc")}
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>{t("settings.suspendCancel")}</AlertDialogCancel>
               <AlertDialogAction
                 onClick={handleSuspendAccount}
                 disabled={isSuspending}
                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                 {isSuspending ? (
                   <Loader2 className="w-4 h-4 animate-spin mr-2" />
                 ) : null}
                 {t("settings.suspendConfirm")}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
      </main>
    </div>
  );
};

export default Settings;
