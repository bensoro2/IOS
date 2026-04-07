import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-FUNDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Authenticate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await anonClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");
    logStep("User authenticated", { userId: userData.user.id });

    const reqBody = await req.json().catch(() => ({}));
    let sessionId = typeof reqBody?.session_id === "string" ? reqBody.session_id : undefined;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fallback: if no session_id from URL, recover latest unprocessed paid funding session for this user
    if (!sessionId) {
      logStep("No session_id provided, searching latest paid funding session");

      const recentSessions = await stripe.checkout.sessions.list({ limit: 50 });
      const unpaidFundingSessions = recentSessions.data
        .filter((s) =>
          s.payment_status === "paid" &&
          s.metadata?.type === "funding"
        )
        .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

      for (const session of unpaidFundingSessions) {
        const { data: processed } = await adminClient
          .from("funding_contributions")
          .select("id")
          .eq("stripe_session_id", session.id)
          .eq("status", "completed")
          .maybeSingle();

        if (!processed) {
          sessionId = session.id;
          break;
        }
      }

      if (!sessionId) {
        const { data: pool } = await adminClient
          .from("funding_pool")
          .select("current_amount, target_amount")
          .eq("is_active", true)
          .single();

        return new Response(JSON.stringify({
          success: true,
          already_processed: true,
          message: "ไม่พบรายการชำระเงินใหม่ที่ต้องตรวจสอบ",
          current_amount: pool?.current_amount || 0,
          target_amount: pool?.target_amount || 10000000,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("Recovered session for verification", { session_id: sessionId });
    }

    logStep("Verifying session", { session_id: sessionId });

    // Check if already processed
    const { data: existing } = await adminClient
      .from("funding_contributions")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .eq("status", "completed");

    if (existing && existing.length > 0) {
      logStep("Already processed");
      const { data: pool } = await adminClient
        .from("funding_pool")
        .select("current_amount, target_amount")
        .eq("is_active", true)
        .single();

      return new Response(JSON.stringify({
        success: true,
        already_processed: true,
        current_amount: pool?.current_amount || 0,
        target_amount: pool?.target_amount || 10000000,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    const metadata = session.metadata;
    if (!metadata || metadata.type !== "funding") {
      throw new Error("Invalid session: not a funding payment");
    }

    const direction = metadata.direction as "increase" | "decrease";
    const amountBaht = parseInt(metadata.amount_baht, 10);
    const userId = metadata.user_id;

    // Funding is a community feature — any authenticated user can trigger verify
    // The contribution is attributed to the user_id from Stripe metadata

    logStep("Payment verified", { direction, amountBaht, userId });

    const { error: insertError } = await adminClient.from("funding_contributions").insert({
      user_id: userId,
      amount: amountBaht,
      direction,
      stripe_session_id: sessionId,
      status: "completed",
    });

    if (insertError) throw new Error(`Failed to insert contribution: ${insertError.message}`);

    // Get current pool
    const { data: pool } = await adminClient
      .from("funding_pool")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!pool) throw new Error("No active funding pool found");

    let newAmount: number;
    if (direction === "increase") {
      newAmount = pool.current_amount + amountBaht;
    } else {
      newAmount = Math.max(0, pool.current_amount - amountBaht);
    }

    logStep("Updating pool", { oldAmount: pool.current_amount, newAmount, target: pool.target_amount });

    let wasReset = false;

    if (newAmount >= pool.target_amount) {
      logStep("GOAL REACHED! Resetting all checkins and levels");
      const { error: resetError } = await adminClient.rpc("reset_all_checkins");
      if (resetError) throw new Error(`Failed to reset all checkins: ${resetError.message}`);
      newAmount = 0;
      wasReset = true;
    } else {
      const { error: updatePoolError } = await adminClient
        .from("funding_pool")
        .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
        .eq("id", pool.id);

      if (updatePoolError) throw new Error(`Failed to update funding pool: ${updatePoolError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      current_amount: newAmount,
      target_amount: pool.target_amount,
      was_reset: wasReset,
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
