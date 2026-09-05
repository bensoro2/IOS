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

type PremiumRow = { premium_until: string | null; plan_type: string | null } | null;

// Shared cache: every component that calls this hook used to fire its own
// request on mount + on every auth event, which produced tens of thousands of
// duplicate user_premium queries. Now one request is shared app-wide.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { userId: string | null; data: PremiumRow; at: number } | null = null;
let inFlight: Promise<PremiumRow> | null = null;
const listeners = new Set<() => void>();

const fetchPremium = async (force = false): Promise<PremiumRow> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    cache = { userId: null, data: null, at: Date.now() };
    return null;
  }

  if (
    !force &&
    cache &&
    cache.userId === user.id &&
    Date.now() - cache.at < CACHE_TTL_MS
  ) {
    return cache.data;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const { data } = await supabase
      .from("user_premium")
      .select("premium_until, plan_type")
      .eq("user_id", user.id)
      .maybeSingle();
    cache = { userId: user.id, data: (data as PremiumRow) ?? null, at: Date.now() };
    return cache.data;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
};

export const invalidatePremiumCache = () => {
  cache = null;
  listeners.forEach((l) => l());
};

export const usePremiumStatus = (): PremiumStatus => {
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState<PlanType>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const apply = (row: PremiumRow) => {
      if (cancelled) return;
      if (row?.premium_until) {
        const isActive = new Date(row.premium_until) > new Date();
        setIsPremium(isActive);
        setPlanType(isActive ? (row.plan_type as PlanType) : null);
        setPremiumUntil(row.premium_until);
      } else {
        setIsPremium(false);
        setPlanType(null);
        setPremiumUntil(null);
      }
      setLoading(false);
    };

    const load = (force = false) => {
      fetchPremium(force)
        .then(apply)
        .catch(() => {
          if (cancelled) return;
          setIsPremium(false);
          setPlanType(null);
          setLoading(false);
        });
    };

    load();

    const onUpdated = () => load(true);
    window.addEventListener("premium-updated", onUpdated);
    listeners.add(onUpdated);

    // Only real sign-in/out changes matter; token refreshes must not refetch.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        cache = null;
        load(true);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("premium-updated", onUpdated);
      listeners.delete(onUpdated);
      subscription.unsubscribe();
    };
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
