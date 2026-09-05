// Subscription pricing — paid ONLY with in-app coins (no direct money)
// Reference rate: 1 Level Coin ≈ ฿0.20, 1 Star Coin = 5 Level Coin ≈ ฿1

export type PlanId = "pro" | "gold";
export type Duration = "1month" | "3months" | "6months";
export type Currency = "level" | "star";

export const LEVEL_COIN_PRICES: Record<PlanId, Record<Duration, number>> = {
  pro: {
    "1month": 500,
    "3months": 1350,
    "6months": 3495,
  },
  gold: {
    "1month": 1000,
    "3months": 2700,
    "6months": 7450,
  },
};

export const STAR_COIN_PRICES: Record<PlanId, Record<Duration, number>> = {
  pro: {
    "1month": 150,
    "3months": 400,
    "6months": 900,
  },
  gold: {
    "1month": 300,
    "3months": 800,
    "6months": 1800,
  },
};

// Legacy export (kept so any leftover import doesn't break the build)
export const SUBSCRIPTION_PRICES = {
  pro: { monthly: 100, quarterly: 270, halfyearly: 699 },
  gold: { monthly: 200, quarterly: 540, halfyearly: 1490 },
} as const;
