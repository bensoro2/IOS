import { supabase } from "@/integrations/supabase/client";

export const createNotification = async ({
  userId,
  actorId,
  type,
  reelId,
  commentId,
}: {
  userId: string;
  actorId: string;
  type: "follow" | "reel_post" | "reel_comment" | "reel_like";
  reelId?: string;
  commentId?: string;
}) => {
  // Don't notify yourself
  if (userId === actorId) return;

  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      actor_id: actorId,
      type,
      reel_id: reelId || null,
      comment_id: commentId || null,
    } as any);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
