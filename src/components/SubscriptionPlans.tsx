import { useState, useEffect } from "react";
import { Crown, Check, Lock, Zap, ChevronRight, Loader2, Settings, History as HistoryIcon } from "lucide-react";
import SubscriptionHistory from "@/components/SubscriptionHistory";
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
import { LEVEL_COIN_PRICES, STAR_COIN_PRICES, PlanId, Duration, Currency } from "@/config/subscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { levelCoinImg } from "@/assets/levelCoin";
import { starCoinDataUrl } from "@/assets/starCoin";

interface PlanConfig {
  id: PlanId;
  name: string;
  icon: React.ReactNode;
  featureKeys: string[];
  color: string;
  gradient: string;
}

const plans: PlanConfig[] = [
  {
    id: "pro",
    name: "Pro Plan",
    icon: <Zap className="w-5 h-5" />,
    featureKeys: ["sub.privatePost", "sub.fastCheckin"],
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "gold",
    name: "Gold Plan",
    icon: <Crown className="w-5 h-5" />,
    featureKeys: ["sub.privatePost", "sub.fastCheckin", "sub.themes"],
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
  },
];

interface SubscriptionPlansProps {
  onSubscribe?: (plan: PlanId, duration: Duration) => void;
}

const SubscriptionPlansContent = ({ onSubscribe }: SubscriptionPlansProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [selectedDuration, setSelectedDuration] = useState<Duration>("1month");
  const [currency, setCurrency] = useState<Currency>("level");
  const [isLoading, setIsLoading] = useState(false);
  const [levelBalance, setLevelBalance] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("users")
      .select("hope_coins, star_coins")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setLevelBalance(Number(data.hope_coins) || 0);
      setStarBalance(Number(data.star_coins) || 0);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;
  const price = currency === "level"
    ? LEVEL_COIN_PRICES[selectedPlan][selectedDuration]
    : STAR_COIN_PRICES[selectedPlan][selectedDuration];
  const balance = currency === "level" ? levelBalance : starBalance;
  const insufficient = balance < price;

  const durationOptions: { id: Duration; labelKey: string; discountKey?: string }[] = [
    { id: "1month", labelKey: "sub.1month" },
    { id: "3months", labelKey: "sub.3months", discountKey: "sub.save10" },
    { id: "6months", labelKey: "sub.6months", discountKey: "sub.save20" },
  ];

  const handleRedeem = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("redeem_subscription_with_coins", {
        _plan: selectedPlan,
        _duration: selectedDuration,
        _currency: currency,
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error === "insufficient_balance") {
          toast.error(t("sub.insufficient"));
        } else {
          toast.error(t("sub.redeemError"));
        }
        return;
      }
      toast.success(t("sub.redeemSuccess"));
      await fetchBalances();
      onSubscribe?.(selectedPlan, selectedDuration);
      // Refresh premium status
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      toast.error(t("sub.redeemError"));
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
            <span className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              {LEVEL_COIN_PRICES[plan.id][selectedDuration].toLocaleString()} LC ·{" "}
              {STAR_COIN_PRICES[plan.id][selectedDuration].toLocaleString()}
              <img src={starCoinDataUrl} alt="" className="w-3 h-3 inline-block" />
            </span>
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="bg-muted/50 rounded-lg p-3">
        <ul className="space-y-1.5 text-sm">
          {currentPlan.featureKeys.map((key, i) => (
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

      {/* Duration */}
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

      {/* Currency toggle */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("sub.payWith")}</p>
        <div className="grid grid-cols-2 gap-2">
          {(["level", "star"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg border-2 text-sm transition-all",
                currency === c
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src={c === "level" ? levelCoinImg : starCoinDataUrl}
                  className="w-4 h-4"
                  alt=""
                />
                <span>{c === "level" ? t("sub.levelCoin") : t("sub.starCoin")}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {t("sub.yourBalance")}: {(c === "level" ? levelBalance : starBalance).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{t("sub.redeem")}</span>
        <span className="flex items-center gap-1.5 font-bold text-lg">
          <img
            src={currency === "level" ? levelCoinImg : starCoinDataUrl}
            className="w-5 h-5"
            alt=""
          />
          {price.toLocaleString()}
        </span>
      </div>

      {/* CTA */}
      {insufficient ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive text-center">{t("sub.insufficient")}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(currency === "level" ? "/hope-coins" : "/star-coins")}
          >
            {currency === "level" ? t("sub.buyLevelCoin") : t("sub.earnStarCoin")}
          </Button>
        </div>
      ) : (
        <Button
          className={cn("w-full bg-gradient-to-r text-white", currentPlan.gradient)}
          onClick={handleRedeem}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {currentPlan.icon}
              <span className="ml-2">
                {t("sub.redeem")} · {price.toLocaleString()} {currency === "level" ? "LC" : "⭐"}
              </span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

const SubscriptionPlans = ({ onSubscribe }: SubscriptionPlansProps) => {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { isPremium, planType, premiumUntil } = usePremiumStatus();
  const { t, language } = useLanguage();

  if (isPremium && premiumUntil) {
    const currentPlanConfig = plans.find((p) => p.id === planType);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={currentPlanConfig?.color}>{currentPlanConfig?.icon}</div>
          <span className="font-semibold">{currentPlanConfig?.name || "Premium"}</span>
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            Active
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("sub.expiresAt")} {format(new Date(premiumUntil), "d MMM yyyy", { locale: getDateLocale(language) })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Crown className="w-4 h-4" />
                {t("sub.managePlan")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  {t("sub.changePlan")}
                </DialogTitle>
              </DialogHeader>
              <SubscriptionPlansContent onSubscribe={onSubscribe} />
            </DialogContent>
          </Dialog>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HistoryIcon className="w-4 h-4" />
                {t("subHistory.title")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-primary" />
                  {t("subHistory.title")}
                </DialogTitle>
              </DialogHeader>
              <SubscriptionHistory />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-lg -m-2 p-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <span className="flex-1 text-left font-medium text-primary">{t("sub.subscribe")}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
