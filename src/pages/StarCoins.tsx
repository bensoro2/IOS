import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, Sparkles, UserPlus, Zap, Crown } from "lucide-react";
import { starCoinDataUrl } from "@/assets/starCoin";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { STAR_COIN_PRICES } from "@/config/subscription";
import { useLanguage } from "@/contexts/LanguageContext";

const StarCoins = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any)
      .from("users")
      .select("star_coins")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setBalance(Number(data.star_coins) || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const earnWays = [
    { icon: CheckCircle2, key: "star.earn.checkin" },
    { icon: Zap, key: "star.earn.fastCheckin" },
    { icon: UserPlus, key: "star.earn.friendCode" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={starCoinDataUrl} alt="Star Coin" className="w-6 h-6" />
          <h1 className="font-semibold text-lg">Star Coin</h1>
        </div>
        <div className="w-9" />
      </header>

      <PullToRefresh onRefresh={fetchBalance} className="flex-1 overflow-y-auto pb-20 px-4">
        {/* Balance */}
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{t("star.balance")}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <img src={starCoinDataUrl} alt="Star Coin" className="w-9 h-9" />
            <span className="text-3xl font-bold text-amber-500">
              {loading ? "..." : balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* How to earn */}
        <div className="bg-muted/50 rounded-xl p-4 mb-5">
          <h2 className="flex items-center gap-2 font-semibold text-sm mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {t("star.earn.title")}
          </h2>
          <ul className="space-y-2.5">
            {earnWays.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-3 text-sm">
                <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="inline-flex flex-wrap items-center gap-1">
                  {t(key).split("⭐").map((part, i, arr) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      {part}
                      {i < arr.length - 1 && (
                        <img src={starCoinDataUrl} alt="" className="w-3.5 h-3.5 inline-block" />
                      )}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Redeem pricing */}
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          {t("star.redeem.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(["pro", "gold"] as const).map((plan) => (
            <div
              key={plan}
              className="rounded-xl border border-border bg-card p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                {plan === "pro" ? (
                  <Zap className="w-4 h-4 text-blue-500" />
                ) : (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
                <span className="font-semibold text-sm capitalize">{plan}</span>
              </div>
              {(["1month", "3months", "6months"] as const).map((d) => (
                <div key={d} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t(`sub.${d}`)}</span>
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    <img src={starCoinDataUrl} className="w-3 h-3" alt="" />
                    {STAR_COIN_PRICES[plan][d].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Redeem CTA — opens SubscriptionPlans dialog */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="font-semibold text-sm mb-1">{t("star.redeem.cta.title")}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("star.redeem.cta.desc")}
          </p>
          <SubscriptionPlans />
        </div>

        {/* Cross-link */}
        <Button
          variant="outline"
          className="w-full mt-5"
          onClick={() => navigate("/hope-coins")}
        >
          {t("star.crossLevel")}
        </Button>
      </PullToRefresh>
    </div>
  );
};

export default StarCoins;
