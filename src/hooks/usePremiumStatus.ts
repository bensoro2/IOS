import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "pro" | "gold" | null;

interface PremiumStatus {
  isPremium: boolean;
  planType: PlanType;
  premiumUntil: string | null;
  loading: boolean;
  // Convenience checks
  hasPrivatePosts: boolean;
  hasFastCheckin: boolean;
  hasThemes: boolean;
}

export const usePremiumStatus = (): PremiumStatus => {
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState<PlanType>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: premiumData } = await supabase
          .from("user_premium")
          .select("premium_until, plan_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (premiumData?.premium_until) {
          const isActive = new Date(premiumData.premium_until) > new Date();
          setIsPremium(isActive);
          setPlanType(isActive ? (premiumData.plan_type as PlanType) : null);
          setPremiumUntil(premiumData.premium_until);
        } else {
          setIsPremium(false);
          setPlanType(null);
          setPremiumUntil(null);
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
        setPlanType(null);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPremiumStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Feature access based on plan type
  const hasPrivatePosts = isPremium && (planType === "pro" || planType === "gold");
  const hasFastCheckin = isPremium && (planType === "pro" || planType === "gold");
  const hasThemes = isPremium && planType === "gold";

  return { 
    isPremium, 
    planType,
    premiumUntil, 
    loading,
    hasPrivatePosts,
    hasFastCheckin,
    hasThemes
  };
};
