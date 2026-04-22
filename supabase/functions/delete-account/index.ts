import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Request received:", req.method);
  if (req.method === "OPTIONS") {
    console.log("OPTIONS preflight handled");
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("User not authenticated");

    const userId = user.id;
    console.log("Starting delete for user:", userId);

    const step = async (label: string, fn: () => Promise<unknown>) => {
      console.log("Step:", label);
      const result = await fn() as { error?: { message: string } };
      if (result?.error) console.error("Error in", label, result.error.message);
    };

    await step("reel_comment_likes", () => supabase.from("reel_comment_likes").delete().eq("user_id", userId));
    await step("reel_comments", () => supabase.from("reel_comments").delete().eq("user_id", userId));
    await step("reel_likes", () => supabase.from("reel_likes").delete().eq("user_id", userId));
    await step("reel_reports", () => supabase.from("reel_reports").delete().eq("reporter_id", userId));
    await step("user_reel_preferences", () => supabase.from("user_reel_preferences").delete().eq("user_id", userId));
    await step("reels", () => supabase.from("reels").delete().eq("user_id", userId));

    await step("notifications", () => supabase.from("notifications").delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`));
    await step("direct_messages sender", () => supabase.from("direct_messages").delete().eq("sender_id", userId));
    await step("direct_messages receiver", () => supabase.from("direct_messages").delete().eq("receiver_id", userId));

    await step("group_chat_last_read", () => supabase.from("group_chat_last_read").delete().eq("user_id", userId));
    await step("group_chat_messages", () => supabase.from("group_chat_messages").delete().eq("user_id", userId));
    await step("kicked_members user", () => supabase.from("kicked_members").delete().eq("user_id", userId));
    await step("kicked_members kicked_by", () => supabase.from("kicked_members").delete().eq("kicked_by", userId));
    await step("join_requests", () => supabase.from("join_requests").delete().eq("user_id", userId));
    await step("group_chat_members", () => supabase.from("group_chat_members").delete().eq("user_id", userId));

    await step("follows", () => supabase.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`));
    await step("blocks", () => supabase.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`));
    await step("user_reports", () => supabase.from("user_reports").delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`));

    await step("user_code_redemptions redeemer", () => supabase.from("user_code_redemptions").delete().eq("redeemer_id", userId));
    await step("user_code_redemptions owner", () => supabase.from("user_code_redemptions").delete().eq("code_owner_id", userId));
    await step("code_redemptions", () => supabase.from("code_redemptions").delete().eq("user_id", userId));

    await step("activity_group_chats null created_by", () => supabase.from("activity_group_chats").update({ created_by: null }).eq("created_by", userId));
    await step("check_plus_codes null created_by", () => supabase.from("check_plus_codes").update({ created_by: null }).eq("created_by", userId));

    await step("user_premium", () => supabase.from("user_premium").delete().eq("user_id", userId));
    await step("push_subscriptions", () => supabase.from("push_subscriptions").delete().eq("user_id", userId));
    await step("fcm_tokens", () => supabase.from("fcm_tokens").delete().eq("user_id", userId));

    await step("check_plus_checkins", () => supabase.from("check_plus_checkins").delete().eq("user_id", userId));
    await step("activity_checkins", () => supabase.from("activity_checkins").delete().eq("user_id", userId));
    await step("fast_checkins", () => supabase.from("fast_checkins").delete().eq("user_id", userId));
    await step("funding_contributions", () => supabase.from("funding_contributions").delete().eq("user_id", userId));
    await step("shops", () => supabase.from("shops").delete().eq("user_id", userId));
    await step("activities", () => supabase.from("activities").delete().eq("user_id", userId));

    await step("users row", () => supabase.from("users").delete().eq("id", userId));

    console.log("Deleting auth user...");
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    console.log("Delete complete for user:", userId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Delete account failed:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
