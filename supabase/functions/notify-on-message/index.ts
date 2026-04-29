import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── FCM helpers ─────────────────────────────────────────────────────────────

function base64urlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getFCMAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  const pemContent = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64urlEncode(new Uint8Array(signatureBuffer))}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  return (await resp.json()).access_token;
}

async function sendFCM(token: string, title: string, body: string, url: string, tag: string, projectId: string, accessToken: string, channelId: string = "default") {
  const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { url: url ?? "/", tag: tag ?? "" },
        android: { priority: "high", notification: { channelId, sound: "default" } },
      },
    }),
  });
  return resp.json();
}

async function sendToUser(
  adminClient: ReturnType<typeof createClient>,
  sa: { project_id: string },
  accessToken: string,
  userId: string,
  title: string,
  body: string,
  url: string,
  tag: string,
  channelId: string = "default"
) {
  const { data: tokens } = await adminClient.from("fcm_tokens").select("token").eq("user_id", userId);
  if (!tokens?.length) return;

  const stale: string[] = [];
  for (const row of tokens) {
    const result = await sendFCM(row.token, title, body, url, tag, sa.project_id, accessToken, channelId);
    if (result?.error?.code === 404 || result?.error?.details?.includes?.("UNREGISTERED")) {
      stale.push(row.token);
    }
  }
  if (stale.length) {
    await adminClient.from("fcm_tokens").delete().eq("user_id", userId).in("token", stale);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  console.log("[notify-on-message] received request", req.method);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const fcmServiceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
    console.log("[notify-on-message] FCM key present:", !!fcmServiceAccountJson);
    if (!fcmServiceAccountJson) {
      console.error("[notify-on-message] FCM_SERVICE_ACCOUNT_KEY not set");
      return new Response(JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const sa = JSON.parse(fcmServiceAccountJson);
    console.log("[notify-on-message] project_id:", sa.project_id);

    const accessToken = await getFCMAccessToken(fcmServiceAccountJson);
    console.log("[notify-on-message] got FCM access token:", !!accessToken);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("[notify-on-message] body table:", body.table, "record keys:", body.record ? Object.keys(body.record) : null);

    const table = body.table;
    const record = body.record;

    // ── DM ────────────────────────────────────────────────────────────────────
    if (table === "direct_messages") {
      const { sender_id, receiver_id, content, media_type } = record;

      const { data: sender } = await adminClient.from("users").select("display_name").eq("id", sender_id).maybeSingle();
      const senderName = sender?.display_name ?? "ผู้ใช้";

      let preview = content ?? "";
      if (media_type === "image") preview = "📷 ส่งรูปภาพ";
      else if (media_type === "audio") preview = "🎤 ส่งข้อความเสียง";
      else if (preview.length > 60) preview = preview.substring(0, 60) + "...";

      await sendToUser(adminClient, sa, accessToken, receiver_id,
        senderName, preview, `/direct/${sender_id}`, `dm-${sender_id}`, "messages");
    }

    // ── Group Chat ────────────────────────────────────────────────────────────
    else if (table === "group_chat_messages") {
      const { user_id: senderId, group_chat_id, content, media_type } = record;

      const [{ data: sender }, { data: groupChat }, { data: members }] = await Promise.all([
        adminClient.from("users").select("display_name").eq("id", senderId).maybeSingle(),
        adminClient.from("activity_group_chats").select("activity_id").eq("id", group_chat_id).maybeSingle(),
        adminClient.from("group_chat_members").select("user_id").eq("group_chat_id", group_chat_id),
      ]);

      let activityTitle = "กลุ่มแชท";
      if (groupChat?.activity_id) {
        const { data: activity } = await adminClient.from("activities").select("title").eq("id", groupChat.activity_id).maybeSingle();
        if (activity?.title) activityTitle = activity.title;
      }

      const senderName = sender?.display_name ?? "ผู้ใช้";
      let preview = content ?? "";
      if (media_type === "image") preview = "📷 ส่งรูปภาพ";
      else if (media_type === "audio") preview = "🎤 ส่งข้อความเสียง";
      else if (preview.length > 60) preview = preview.substring(0, 60) + "...";

      const recipients = (members ?? []).filter((m) => m.user_id !== senderId);
      await Promise.all(recipients.map((m) =>
        sendToUser(adminClient, sa, accessToken, m.user_id,
          activityTitle, `${senderName}: ${preview}`,
          `/group-chat/${group_chat_id}`, `group-${group_chat_id}`, "group_chat")
      ));
    }

    // ── Notifications table (follow, reel_like, etc.) ─────────────────────────
    else if (table === "notifications") {
      const { user_id, actor_id, type, reel_id } = record;
      if (user_id === actor_id) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

      const { data: actor } = await adminClient.from("users").select("display_name").eq("id", actor_id).maybeSingle();
      const actorName = actor?.display_name ?? "ผู้ใช้";

      let body = "";
      let url = "/notifications";
      if (type === "follow") { body = `${actorName} ได้ติดตามคุณ`; url = `/user/${actor_id}`; }
      else if (type === "reel_like") { body = `${actorName} ได้กดถูกใจ Reels ของคุณ`; url = reel_id ? `/reels?startId=${reel_id}` : "/notifications"; }
      else if (type === "reel_comment") { body = `${actorName} ได้แสดงความคิดเห็นใน Reels ของคุณ`; url = reel_id ? `/reels?startId=${reel_id}` : "/notifications"; }

      if (body) {
        await sendToUser(adminClient, sa, accessToken, user_id,
          "Levelon", body, url, `notif-${type}-${actor_id}`, "social");
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("notify-on-message error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
