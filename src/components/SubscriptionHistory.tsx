import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/dateLocale";
import { Crown, Zap, Loader2, Coins, Star, CreditCard, Gift } from "lucide-react";

interface HistoryRow {
  id: string;
  plan_type: string;
  duration: string | null;
  days_added: number;
  price: number | null;
  source: string;
  premium_until_after: string | null;
  created_at: string;
}

const sourceIcon = (src: string) => {
  switch (src) {
    case "level_coin": return <Coins className="w-3.5 h-3.5 text-primary" />;
    case "star_coin": return <Star className="w-3.5 h-3.5 text-amber-500" />;
    case "promptpay": return <CreditCard className="w-3.5 h-3.5 text-primary" />;
    case "promo_code": return <Gift className="w-3.5 h-3.5 text-primary" />;
    default: return <Coins className="w-3.5 h-3.5 text-primary" />;
  }
};

const SubscriptionHistory = () => {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = getDateLocale(language);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from("subscription_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data as HistoryRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const sourceLabel = (s: string) => {
    switch (s) {
      case "level_coin": return t("sub.levelCoin");
      case "star_coin": return t("sub.starCoin");
      case "promptpay": return "PromptPay";
      case "promo_code": return t("settings.promoCode");
      default: return s;
    }
  };

  const durationLabel = (d: string | null) => {
    if (!d) return "";
    if (d === "1month") return t("sub.1month");
    if (d === "3months") return t("sub.3months");
    if (d === "6months") return t("sub.6months");
    return d;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        {t("subHistory.empty")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {rows.map((r) => {
        const isGold = r.plan_type === "gold";
        return (
          <div key={r.id} className="py-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isGold ? "bg-amber-500/15" : "bg-blue-500/15"}`}>
                {isGold
                  ? <Crown className="w-4 h-4 text-amber-500" />
                  : <Zap className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {isGold ? "Gold Plan" : "Pro Plan"} · {durationLabel(r.duration)}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {sourceIcon(r.source)}
                  <span>{sourceLabel(r.source)}</span>
                  {r.price != null && r.source !== "promo_code" && (
                    <span>· {r.price.toLocaleString()}</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {format(new Date(r.created_at), "d MMM yyyy HH:mm", { locale })}
                </div>
              </div>
            </div>
            {r.premium_until_after && (
              <div className="text-right shrink-0">
                <div className="text-[10px] text-muted-foreground">{t("sub.expiresAt")}</div>
                <div className="text-[11px] font-medium">
                  {format(new Date(r.premium_until_after), "d MMM yyyy", { locale })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubscriptionHistory;
