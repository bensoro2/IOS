import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-COIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { status: session.payment_status, metadata: session.metadata });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, pending: true, message: "Payment not completed yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (session.metadata?.type !== "hope_coin_purchase") {
      return new Response(JSON.stringify({ success: false, message: "Not a coin purchase session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const targetUserId = session.metadata.user_id;
    const coins = parseInt(session.metadata.coins || "0");

    if (!coins || !targetUserId) {
      throw new Error("Invalid session metadata");
    }

    // Check if already processed using stripe_session_id in funding_contributions or a custom check
    // Use payments table but with a generated UUID and check by matching stripe session in status field
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("status", `coin_${session_id}`)
      .maybeSingle();

    if (existing) {
      logStep("Already processed", { session_id });
      return new Response(JSON.stringify({ success: true, already_processed: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current coins and add
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("hope_coins")
      .eq("id", targetUserId)
      .maybeSingle();

    const currentCoins = userData?.hope_coins || 0;

    const { error: coinError } = await supabaseAdmin
      .from("users")
      .update({ hope_coins: currentCoins + coins })
      .eq("id", targetUserId);

    if (coinError) throw new Error(`Failed to add coins: ${coinError.message}`);

    // Record payment for idempotency (use auto-generated UUID, store session_id in status field)
    await supabaseAdmin
      .from("payments")
      .insert({ user_id: targetUserId, amount: coins, status: `coin_${session_id}` });

    logStep("Coins added", { userId: targetUserId, coins, newBalance: currentCoins + coins });

    return new Response(JSON.stringify({
      success: true,
      coins_added: coins,
      new_balance: currentCoins + coins,
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
