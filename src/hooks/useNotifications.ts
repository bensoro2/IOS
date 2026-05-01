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
      // Use DB function (SECURITY DEFINER) to bypass RLS and prevent duplicates atomically
      await supabase.rpc("upsert_follow_notification", {
        p_user_id: userId,
        p_actor_id: actorId,
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: userId,
        actor_id: actorId,
        type,
        reel_id: reelId || null,
        comment_id: commentId || null,
      } as any);
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const deleteFollowNotification = async (userId: string, actorId: string) => {
  try {
    // Use DB function (SECURITY DEFINER) to bypass RLS
    await supabase.rpc("delete_follow_notification", {
      p_user_id: userId,
      p_actor_id: actorId,
    });
  } catch (error) {
    console.error("Error deleting follow notification:", error);
  }
};
