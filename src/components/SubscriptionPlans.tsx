import { useState, useEffect } from "react";
import { Crown, Check, Lock, Zap, ChevronRight, Loader2, Settings, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePremiumStatus, PlanType } from "@/hooks/usePremiumStatus";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/dateLocale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUBSCRIPTION_PRICES } from "@/config/subscription";
import { useLanguage } from "@/contexts/LanguageContext";

type Duration = "1month" | "3months" | "6months";
type PaymentMethod = "promptpay";

interface PlanConfig {
  id: PlanType;
  name: string;
  icon: React.ReactNode;
  featureKeys: string[];
  prices: Record<Duration, number>;
  color: string;
  gradient: string;
}

const plans: PlanConfig[] = [
  {
    id: "pro",
    name: "Pro Plan",
    icon: <Zap className="w-5 h-5" />,
    featureKeys: ["sub.privatePost", "sub.fastCheckin"],
    prices: {
      "1month": SUBSCRIPTION_PRICES.pro.monthly,
      "3months": SUBSCRIPTION_PRICES.pro.quarterly,
      "6months": SUBSCRIPTION_PRICES.pro.halfyearly,
    },
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "gold",
    name: "Gold Plan",
    icon: <Crown className="w-5 h-5" />,
    featureKeys: ["sub.privatePost", "sub.fastCheckin", "sub.themes"],
    prices: {
      "1month": SUBSCRIPTION_PRICES.gold.monthly,
      "3months": SUBSCRIPTION_PRICES.gold.quarterly,
      "6months": SUBSCRIPTION_PRICES.gold.halfyearly,
    },
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
];

interface SubscriptionPlansProps {
  onSubscribe?: (plan: PlanType, duration: Duration) => void;
}

const SubscriptionPlansContent = ({ onSubscribe }: SubscriptionPlansProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");
  const [selectedDuration, setSelectedDuration] = useState<Duration>("1month");
  const [selectedPayment] = useState<PaymentMethod>("promptpay");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const currentPlan = plans.find((p) => p.id === selectedPlan);

  const durationOptions: { id: Duration; labelKey: string; discountKey?: string }[] = [
    { id: "1month", labelKey: "sub.1month" },
    { id: "3months", labelKey: "sub.3months", discountKey: "sub.save10" },
    { id: "6months", labelKey: "sub.6months", discountKey: "sub.save20" },
  ];

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-promptpay-checkout", {
        body: { plan: selectedPlan, duration: selectedDuration },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
      onSubscribe?.(selectedPlan, selectedDuration);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(t("sub.checkoutError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Selection */}
      <div className="grid grid-cols-2 gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
              selectedPlan === plan.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
          >
            {selectedPlan === plan.id && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={cn("mb-2", plan.color)}>{plan.icon}</div>
            <span className="font-semibold text-sm">{plan.name}</span>
            <span className="text-lg font-bold mt-1">
              ฿{plan.prices[selectedDuration]}
            </span>
          </button>
        ))}
      </div>

      {/* Features List */}
      <div className="bg-muted/50 rounded-lg p-3">
        <ul className="space-y-1.5 text-sm">
          {currentPlan?.featureKeys.map((key, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              {t(key)}
            </li>
          ))}
          {selectedPlan === "pro" && (
            <li className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              {t("sub.themesGoldOnly")}
            </li>
          )}
        </ul>
      </div>

      {/* Duration Selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("sub.selectDuration")}</p>
        <div className="flex gap-2">
          {durationOptions.map((d) => (
            <div key={d.id} className="flex-1 flex flex-col items-center">
              <button
                onClick={() => setSelectedDuration(d.id)}
                className={cn(
                  "w-full py-2 px-3 rounded-lg border-2 text-sm transition-all",
                  selectedDuration === d.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                {t(d.labelKey)}
              </button>
              {d.discountKey && (
                <span className="mt-1 text-[10px] text-emerald-600 font-medium">
                  {t(d.discountKey)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method - PromptPay only */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("sub.paymentMethod")}</p>
        <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg border-2 border-primary bg-primary/5 text-sm font-medium justify-center">
          <QrCode className="w-4 h-4" />
          PromptPay QR
        </div>
      </div>

      {/* Subscribe Button */}
      <Button
        className={cn(
          "w-full bg-gradient-to-r text-white",
          currentPlan?.gradient || "from-primary to-primary"
        )}
        onClick={handleSubscribe}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {currentPlan?.icon}
            <span className="ml-2">
              {t("sub.subscribe")} {currentPlan?.name} - ฿{currentPlan?.prices[selectedDuration]}
            </span>
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {selectedPayment === "promptpay" ? t("sub.promptpayDesc") : t("sub.cardDesc")}
      </p>
    </div>
  );
};

const SubscriptionPlans = ({ onSubscribe }: SubscriptionPlansProps) => {
  const [open, setOpen] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isPromoUser, setIsPromoUser] = useState(false);
  const { isPremium, planType, premiumUntil } = usePremiumStatus();
  const { t, language } = useLanguage();

  useEffect(() => {
    const checkPromoUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("code_redemptions")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (data && data.length > 0) setIsPromoUser(true);
    };
    checkPromoUser();
  }, []);

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error(t("sub.portalError"));
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // If user is already premium, show current status
  if (isPremium && premiumUntil) {
    const currentPlanConfig = plans.find((p) => p.id === planType);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={currentPlanConfig?.color}>
            {currentPlanConfig?.icon}
          </div>
          <span className="font-semibold">{currentPlanConfig?.name || "Premium"}</span>
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            Active
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("sub.expiresAt")} {format(new Date(premiumUntil), "d MMM yyyy", { locale: getDateLocale(language) })}
        </p>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Crown className="w-4 h-4" />
                {t("sub.managePlan")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  {t("sub.changePlan")}
                </DialogTitle>
              </DialogHeader>
              <SubscriptionPlansContent onSubscribe={onSubscribe} />
            </DialogContent>
          </Dialog>
          {!isPromoUser && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  {t("sub.manageSubscription")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Non-premium: show subscribe button that opens dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-lg -m-2 p-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <span className="flex-1 text-left font-medium text-primary">{t("sub.subscribe")}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            {t("sub.subscribe")}
          </DialogTitle>
        </DialogHeader>
        <SubscriptionPlansContent onSubscribe={onSubscribe} />
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlans;
