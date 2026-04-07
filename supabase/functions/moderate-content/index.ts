import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, imageUrl, imageUrls } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const textToCheck = [title, description].filter(Boolean).join("\n");

    // Collect all image URLs (support both single and multiple)
    const allImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      allImageUrls.push(...imageUrls);
    } else if (imageUrl) {
      allImageUrls.push(imageUrl);
    }

    // If no text and no images, it's safe
    if (!textToCheck.trim() && allImageUrls.length === 0) {
      return new Response(JSON.stringify({ safe: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages for AI - include all images
    const userContent: any[] = [];

    if (allImageUrls.length > 0) {
      userContent.push({
        type: "text",
        text: `Check this post for inappropriate content. The post text is: "${textToCheck || "(no text)"}". Also analyze ALL ${allImageUrls.length} attached images (frames from a video) for nudity, sexual content, extreme violence, gore, or other inappropriate content. If ANY frame contains inappropriate content, mark it as UNSAFE. Respond ONLY with JSON.`,
      });
      for (const url of allImageUrls) {
        userContent.push({
          type: "image_url",
          image_url: { url },
        });
      }
    } else {
      userContent.push({
        type: "text",
        text: `Check this post:\n${textToCheck}`,
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a strict content moderation system for a community activity matching app (Thai language).
Your job is to classify user-submitted content (text AND images) as SAFE or UNSAFE.

UNSAFE content includes:
- Sexual, pornographic, or nudity content (including revealing/suggestive images)
- Extreme violence, gore, or graphic injuries
- Hate speech, discrimination, or harassment
- Illegal activities (drugs, weapons trafficking, etc.)
- Spam or scam content
- Self-harm or suicide promotion

SAFE content includes:
- Normal activity posts (sports, arts, hobbies, outdoor activities)
- Casual language, slang, or informal Thai
- Normal photos of people doing activities, landscapes, sports equipment, etc.

IMPORTANT: You may receive multiple image frames from a video. Check ALL frames carefully. If ANY single frame contains inappropriate content, the ENTIRE submission must be marked UNSAFE.
Be STRICT about nudity and sexual content. Any image showing nudity, sexual poses, or sexually suggestive content MUST be flagged as UNSAFE.

Respond ONLY with a JSON object:
{"safe": true} or {"safe": false, "reason": "brief reason in Thai"}`,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ safe: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
