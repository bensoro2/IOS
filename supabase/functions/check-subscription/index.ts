import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product ID to plan type mapping (you may need to update these after first subscription)
const PRODUCT_TO_PLAN: Record<string, string> = {
  // These will be populated based on actual Stripe product IDs
  // For now, we'll determine plan type from price metadata
};

// Price ID to plan type mapping
const PRICE_TO_PLAN: Record<string, string> = {
  // Gold prices
  "price_1SxTpkQGPuglRnROQ936tOo5": "gold",
  "price_1SxTr3QGPuglRnROa1Ycsrci": "gold",
  "price_1SxTr3QGPuglRnROufhodpHP": "gold",
  // Pro prices
  "price_1SxTUGQGPuglRnROBgOzJcaI": "pro",
  "price_1SxThMQGPuglRnROUDxD7Dhy": "pro",
  "price_1SxThMQGPuglRnRORxWZWJec": "pro",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let planType: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Get price ID to determine plan type
      const priceId = subscription.items.data[0].price.id;
      planType = PRICE_TO_PLAN[priceId] || "pro"; // Default to pro if not found
      logStep("Determined plan type", { priceId, planType });

      // Update user_premium table
      const { error: upsertError } = await supabaseClient
        .from("user_premium")
        .upsert({
          user_id: user.id,
          premium_until: subscriptionEnd,
          plan_type: planType,
        }, {
          onConflict: "user_id",
        });

      if (upsertError) {
        logStep("Error updating user_premium", { error: upsertError.message });
      } else {
        logStep("Updated user_premium table");
      }
    } else {
      logStep("No active subscription found");
      
      // Clear premium status if no active subscription
      const { error: updateError } = await supabaseClient
        .from("user_premium")
        .update({ 
          premium_until: new Date().toISOString() // Set to past date
        })
        .eq("user_id", user.id);
        
      if (updateError) {
        logStep("Error clearing premium status", { error: updateError.message });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_type: planType,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
