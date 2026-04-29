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
  if (userId === actorId) return;

  try {
    if (type === "follow") {
      // Remove any existing follow notification from this actor to prevent duplicates
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)
        .eq("actor_id", actorId)
        .eq("type", "follow");
    }

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

export const deleteFollowNotification = async (userId: string, actorId: string) => {
  try {
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("actor_id", actorId)
      .eq("type", "follow");
  } catch (error) {
    console.error("Error deleting follow notification:", error);
  }
};
