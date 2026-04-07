// Subscription plan prices (THB)
export const SUBSCRIPTION_PRICES = {
  pro: {
    monthly: 100,
    quarterly: 270,   // ~10% discount
    halfyearly: 699,  // 6 months
  },
  gold: {
    monthly: 200,
    quarterly: 540,   // ~10% discount
    halfyearly: 1490, // 6 months
  },
} as const;
