import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── APNs helpers (iOS direct) ───────────────────────────────────────────────

function isAPNsToken(token: string): boolean {
  return /^[0-9a-f]{64}$/i.test(token);
}

async function getAPNsJWT(privateKeyPem: string, keyId: string, teamId: string): Promise<string> {
  const pemContent = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "").trim();
  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", binaryDer.buffer,
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );
  const header = btoa(JSON.stringify({ alg: "ES256", kid: keyId })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const payload = btoa(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const signingInput = `${header}.${payload}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${signingInput}.${sigB64}`;
}

async function sendAPNs(token: string, title: string, body: string, url: string, tag: string): Promise<{ status: number; body: string } | null> {
  const keyPem = Deno.env.get("APNS_PRIVATE_KEY") ?? "";
  const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
  const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "com.levelon.app";
  if (!keyPem || !keyId || !teamId) { console.error("[APNs] missing secrets"); return null; }

  const jwt = await getAPNsJWT(keyPem, keyId, teamId);
  const resp = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, url: url ?? "/", tag: tag ?? "" }),
  });
  return { status: resp.status, body: await resp.text() };
}

// ─── Web Push (browser/PWA) ───────────────────────────────────────────────────

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  const webPush = await import("npm:web-push@3.6.7");
  webPush.setVapidDetails("mailto:admin@levelon.app", vapidPublicKey, vapidPrivateKey);
  await webPush.sendNotification(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    payload
  );
}

// ─── FCM (native Android/iOS) ────────────────────────────────────────────────

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

  // Import RS256 private key
  const pemContent = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  const signature = base64urlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${signingInput}.${signature}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  return data.access_token;
}

async function sendFCMMessage(
  fcmToken: string,
  title: string,
  body: string,
  url: string,
  tag: string,
  projectId: string,
  accessToken: string
) {
  const resp = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          data: { url: url ?? "/", tag: tag ?? "" },
          android: {
            priority: "high",
            notification: { channelId: "default", sound: "default" },
          },
        },
      }),
    }
  );
  return resp.json();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, title, body, url, tag } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let sent = 0;

    // ── 1. ส่งผ่าน FCM (native) ──────────────────────────────────────────────
    const fcmServiceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
    const { data: allTokens } = await adminClient
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", userId);

    const staleTokens: string[] = [];

    // ── 1a. APNs tokens (iOS) ────────────────────────────────────────────────
    for (const row of (allTokens ?? []).filter((r: { token: string }) => isAPNsToken(r.token))) {
      try {
        const result = await sendAPNs(row.token, title, body, url ?? "/", tag ?? "");
        console.log("APNs result:", JSON.stringify(result));
        if (result?.status === 410 || result?.status === 400) staleTokens.push(row.token);
        else if (result) sent++;
      } catch (err) {
        console.error("APNs send error:", err);
      }
    }

    // ── 1b. FCM tokens (Android) ─────────────────────────────────────────────
    if (fcmServiceAccountJson) {
      try {
        const sa = JSON.parse(fcmServiceAccountJson);
        const accessToken = await getFCMAccessToken(fcmServiceAccountJson);

        for (const row of (allTokens ?? []).filter((r: { token: string }) => !isAPNsToken(r.token))) {
          try {
            const result = await sendFCMMessage(
              row.token, title, body, url, tag, sa.project_id, accessToken
            );
            if (result?.error?.code === 404 || result?.error?.details?.includes("UNREGISTERED")) {
              staleTokens.push(row.token);
            } else {
              sent++;
            }
          } catch (err) {
            console.error("FCM send error:", err);
          }
        }
      } catch (err) {
        console.error("FCM setup error:", err);
      }
    }

    if (staleTokens.length > 0) {
      await adminClient.from("fcm_tokens").delete()
        .eq("user_id", userId).in("token", staleTokens);
    }

    // ── 2. ส่งผ่าน Web Push (browser/PWA) ───────────────────────────────────
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (vapidPublicKey && vapidPrivateKey) {
      const { data: subscriptions } = await adminClient
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      const staleEndpoints: string[] = [];
      const payload = JSON.stringify({ title, body, url, tag });

      for (const sub of subscriptions ?? []) {
        try {
          await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload, vapidPublicKey, vapidPrivateKey
          );
          sent++;
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      }

      if (staleEndpoints.length > 0) {
        await adminClient.from("push_subscriptions").delete()
          .eq("user_id", userId).in("endpoint", staleEndpoints);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-push error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
