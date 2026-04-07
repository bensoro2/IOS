import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget Web Push to a specific user via the send-push edge function.
 * Errors are silently logged so they never break the caller.
 */
export const triggerPush = async ({
  userId,
  title,
  body,
  url,
  tag,
}: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) => {
  try {
    await supabase.functions.invoke("send-push", {
      body: { userId, title, body, url, tag },
    });
  } catch (err) {
    console.error("triggerPush error:", err);
  }
};
