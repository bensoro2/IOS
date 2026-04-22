import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresence = (currentUserId: string | null) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set<string>();
        Object.values(state).forEach(presences => {
          presences.forEach((p: any) => {
            if (p.user_id) ids.add(p.user_id);
          });
        });
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return onlineUsers;
};
