import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("User not authenticated");

    const userId = user.id;

    // Delete all user data in dependency order
    await supabase.from("reel_comment_likes").delete().eq("user_id", userId);
    await supabase.from("reel_comments").delete().eq("user_id", userId);
    await supabase.from("reel_likes").delete().eq("user_id", userId);
    await supabase.from("reel_reports").delete().eq("reporter_id", userId);
    await supabase.from("user_reel_preferences").delete().eq("user_id", userId);
    await supabase.from("reels").delete().eq("user_id", userId);

    await supabase.from("notifications").delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`);
    await supabase.from("direct_messages").delete().eq("sender_id", userId);
    await supabase.from("direct_messages").delete().eq("receiver_id", userId);

    await supabase.from("group_chat_last_read").delete().eq("user_id", userId);
    await supabase.from("group_chat_messages").delete().eq("user_id", userId);
    await supabase.from("kicked_members").delete().eq("user_id", userId);
    await supabase.from("join_requests").delete().eq("user_id", userId);
    await supabase.from("group_chat_members").delete().eq("user_id", userId);

    await supabase.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    await supabase.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    await supabase.from("user_reports").delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`);
    // user_code_redemptions uses redeemer_id/code_owner_id (not user_id)
    await supabase.from("user_code_redemptions").delete().eq("redeemer_id", userId);
    await supabase.from("user_code_redemptions").delete().eq("code_owner_id", userId);
    await supabase.from("code_redemptions").delete().eq("user_id", userId);
    // NULL out created_by refs that have no CASCADE (prevents FK violation on auth.users delete)
    await supabase.from("activity_group_chats").update({ created_by: null }).eq("created_by", userId);
    await supabase.from("check_plus_codes").update({ created_by: null }).eq("created_by", userId);
    await supabase.from("user_premium").delete().eq("user_id", userId);
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    await supabase.from("fcm_tokens").delete().eq("user_id", userId);

    await supabase.from("check_plus_checkins").delete().eq("user_id", userId);
    await supabase.from("activity_checkins").delete().eq("user_id", userId);
    await supabase.from("fast_checkins").delete().eq("user_id", userId);
    await supabase.from("funding_contributions").delete().eq("user_id", userId);

    // Delete main user row
    await supabase.from("users").delete().eq("id", userId);

    // Finally delete the auth user (permanent, irreversible)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
