// reel-og: OG proxy for reel sharing — no JWT required
// ─────────────────────────────────────────────────────
// แต่ละ platform มี handler แยกกัน แก้ไขอันหนึ่งไม่กระทบอื่น
// ─────────────────────────────────────────────────────
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const APP_ORIGIN   = "https://levelon.lovable.app";
const SUPABASE_URL = "https://exjeqvboxyacmtzclnxq.supabase.co";
const DEFAULT_IMAGE = `${SUPABASE_URL}/storage/v1/object/public/reel-videos/og-image.png`;

// ═══════════════════════════════════════════════════════════════
//  Platform detection
// ═══════════════════════════════════════════════════════════════

const FACEBOOK_BOT    = /facebookexternalhit|facebot/i;        // Facebook link crawler
const TWITTER_BOT     = /twitterbot/i;                         // Twitter / X crawler
const LINKEDIN_BOT    = /linkedinbot/i;                        // LinkedIn crawler
const WHATSAPP_BOT    = /whatsapp/i;                           // WhatsApp link preview
const TELEGRAM_BOT    = /telegrambot/i;                        // Telegram link preview
const SLACK_BOT       = /slackbot/i;                           // Slack unfurl
const DISCORD_BOT     = /Discordbot/i;                         // Discord embed
const GOOGLE_BOT      = /googlebot|bingbot|applebot/i;         // Search engines

function isBot(ua: string): boolean {
  return (
    FACEBOOK_BOT.test(ua) ||
    TWITTER_BOT.test(ua)  ||
    LINKEDIN_BOT.test(ua) ||
    WHATSAPP_BOT.test(ua) ||
    TELEGRAM_BOT.test(ua) ||
    SLACK_BOT.test(ua)    ||
    DISCORD_BOT.test(ua)  ||
    GOOGLE_BOT.test(ua)
  );
  // NOTE: "instagram" ไม่อยู่ในนี้
  // Instagram crawler ใช้ "facebookexternalhit" เหมือนกัน
  // Instagram IAB (in-app browser) มี "Instagram" ใน UA — ต้องได้ 302 ไม่ใช่ OG HTML
}

// ═══════════════════════════════════════════════════════════════
//  HTML escape helper
// ═══════════════════════════════════════════════════════════════

const e = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ═══════════════════════════════════════════════════════════════
//  Handler: regular users → 302 redirect
//  Android App Links จะ intercept URL นี้และเปิด Levelon app โดยตรง
// ═══════════════════════════════════════════════════════════════

function handleUser(appUrl: string): Response {
  return Response.redirect(appUrl, 302);
}

// ═══════════════════════════════════════════════════════════════
//  Handler: Facebook bot (facebookexternalhit)
//  แยกออกมาเพราะ Facebook มี quirk เฉพาะ:
//  - ต้องมี og:image:secure_url เพื่อให้รูปแสดงใน post หลังโพส
//  - og:url ต้องชี้กลับมาที่ edge function เพื่อให้ scrape OG ของ reel
//  - appUrl ใช้เป็น fallback link เมื่อคลิก (Android App Links จะ intercept)
// ═══════════════════════════════════════════════════════════════

function handleFacebookBot(opts: {
  title: string; description: string; image: string | null;
  videoUrl: string; appUrl: string; reelId: string; fbAppId: string;
}): Response {
  const { title, description, image, videoUrl, appUrl, reelId, fbAppId } = opts;
  const ogUrl = `${SUPABASE_URL}/functions/v1/reel-og?id=${reelId}`;

  const imageTags = image ? `
  <meta property="og:image"             content="${e(image)}" />
  <meta property="og:image:secure_url"  content="${e(image)}" />
  <meta property="og:image:type"        content="image/jpeg" />
  <meta property="og:image:width"       content="720" />
  <meta property="og:image:height"      content="1280" />` : "";

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(title)}</title>
  <meta property="fb:app_id"            content="${e(fbAppId)}" />
  <meta property="og:type"              content="website" />
  <meta property="og:site_name"         content="Levelon" />
  <meta property="og:url"               content="${e(ogUrl)}" />
  <meta property="og:title"             content="${e(title)}" />
  <meta property="og:description"       content="${e(description)}" />${imageTags}
  <meta property="og:video"             content="${e(videoUrl)}" />
  <meta property="og:video:secure_url"  content="${e(videoUrl)}" />
  <meta property="og:video:type"        content="video/mp4" />
  <meta property="og:video:width"       content="1080" />
  <meta property="og:video:height"      content="1920" />
</head>
<body><p><a href="${e(appUrl)}">${e(title)}</a></p></body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "access-control-allow-origin": "*" },
  });
}

// ═══════════════════════════════════════════════════════════════
//  Handler: other social media bots (Twitter, LinkedIn, etc.)
// ═══════════════════════════════════════════════════════════════

function handleGenericBot(opts: {
  title: string; description: string; image: string | null;
  videoUrl: string; appUrl: string; reelId: string;
}): Response {
  const { title, description, image, videoUrl, appUrl, reelId } = opts;
  const ogUrl = `${SUPABASE_URL}/functions/v1/reel-og?id=${reelId}`;

  const imageTags = image ? `
  <meta property="og:image"        content="${e(image)}" />
  <meta property="og:image:width"  content="720" />
  <meta property="og:image:height" content="1280" />
  <meta name="twitter:image"       content="${e(image)}" />` : "";

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(title)}</title>
  <meta property="og:type"              content="website" />
  <meta property="og:site_name"         content="Levelon" />
  <meta property="og:url"               content="${e(ogUrl)}" />
  <meta property="og:title"             content="${e(title)}" />
  <meta property="og:description"       content="${e(description)}" />${imageTags}
  <meta property="og:video"             content="${e(videoUrl)}" />
  <meta property="og:video:secure_url"  content="${e(videoUrl)}" />
  <meta property="og:video:type"        content="video/mp4" />
  <meta property="og:video:width"       content="1080" />
  <meta property="og:video:height"      content="1920" />
  <meta name="twitter:card"             content="${image ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title"            content="${e(title)}" />
  <meta name="twitter:description"      content="${e(description)}" />
</head>
<body><p><a href="${e(appUrl)}">${e(title)}</a></p></body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "access-control-allow-origin": "*" },
  });
}

// ═══════════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  const url    = new URL(req.url);
  const reelId = url.searchParams.get("id");

  if (!reelId) return Response.redirect(`${APP_ORIGIN}/reels`, 302);

  const appUrl = `${APP_ORIGIN}/reels?startId=${reelId}`;
  const ua     = req.headers.get("user-agent") ?? "";

  // ── Regular user (browser / Messenger IAB / Instagram IAB) ──
  if (!isBot(ua)) return handleUser(appUrl);

  // ── Social media bot ─────────────────────────────────────────
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("reels")
      .select("id, description, video_url, thumbnail_url, user_id, views_count")
      .eq("id", reelId)
      .maybeSingle();

    let reel: any = data;
    if (error) {
      const { data: fb } = await supabase
        .from("reels")
        .select("id, description, video_url, user_id, views_count")
        .eq("id", reelId)
        .maybeSingle();
      reel = fb;
    }

    if (!reel) return handleUser(appUrl);

    const { data: user } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", reel.user_id)
      .maybeSingle();

    const botOpts = {
      title:       reel.description?.slice(0, 100) || "ดูคลิปนี้บน Levelon",
      description: `โดย @${user?.display_name ?? "Levelon"} · ${(reel.views_count ?? 0).toLocaleString("th-TH")} ครั้ง`,
      image:       reel.thumbnail_url ?? DEFAULT_IMAGE,
      videoUrl:    reel.video_url,
      appUrl,
      reelId,
    };
    const fbAppId = Deno.env.get("FB_APP_ID") ?? "";
    return FACEBOOK_BOT.test(ua)
      ? handleFacebookBot({ ...botOpts, fbAppId })
      : handleGenericBot(botOpts);
  } catch {
    return handleUser(appUrl);
  }
});
