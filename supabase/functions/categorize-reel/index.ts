import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "entertainment",
  "education",
  "lifestyle",
  "food",
  "travel",
  "sports",
  "music",
  "comedy",
  "beauty",
  "tech",
  "pets",
  "other",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reel_id, description } = await req.json();

    if (!reel_id) {
      return new Response(JSON.stringify({ error: "reel_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fail open: if no API key, set category to "other"
      console.warn("LOVABLE_API_KEY not configured, defaulting to 'other'");
      return new Response(JSON.stringify({ category: "other" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textToAnalyze = description || "";

    if (!textToAnalyze.trim()) {
      // No description, default to other
      await updateReelCategory(reel_id, "other");
      return new Response(JSON.stringify({ category: "other" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to categorize
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a content categorizer. Given a video description, respond with ONLY one category from this list: ${CATEGORIES.join(", ")}. No explanation, just the category word.`,
            },
            {
              role: "user",
              content: `Categorize this video description: "${textToAnalyze}"`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429 || aiResponse.status === 402) {
        console.warn("AI rate limited or payment required, defaulting to 'other'");
        await updateReelCategory(reel_id, "other");
        return new Response(JSON.stringify({ category: "other" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status);
      await updateReelCategory(reel_id, "other");
      return new Response(JSON.stringify({ category: "other" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawCategory = (aiData.choices?.[0]?.message?.content || "other")
      .trim()
      .toLowerCase();

    const category = CATEGORIES.includes(rawCategory) ? rawCategory : "other";

    await updateReelCategory(reel_id, category);

    return new Response(JSON.stringify({ category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-reel error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", category: "other" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function updateReelCategory(reelId: string, category: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("reels")
    .update({ category })
    .eq("id", reelId);

  if (error) {
    console.error("Error updating reel category:", error);
  }
}
