import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getNotificationsEnabled } from "@/hooks/useNotificationPreference";
import { isGroupMuted, isDmMuted } from "@/hooks/useGroupNotificationMute";
import { toast } from "sonner";
import { triggerPush } from "@/hooks/usePushTrigger";
import { APP_NAME } from "@/config/defaults";
import { useLanguage } from "@/contexts/LanguageContext";

export const useMessageNotifications = () => {
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // DM notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dm_notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id === userId) return;

          const { data: sender } = await supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", msg.sender_id)
            .maybeSingle();

          const senderName = sender?.display_name || t("common.unknownUser");
          const avatarUrl = sender?.avatar_url || "";
          let preview = msg.content || "";
          if (msg.media_type === "image") preview = t("notif.sentImage");
          else if (msg.media_type === "audio") preview = t("notif.sentAudio");
          else if (preview.length > 50) preview = preview.substring(0, 50) + "...";

          if (!getNotificationsEnabled()) return;
          if (isDmMuted(msg.sender_id)) return;

          const isVisible = document.visibilityState === "visible";

          // Push only when app is in background
          if (!isVisible) {
            triggerPush({
              userId: msg.receiver_id,
              title: senderName,
              body: preview,
              url: `/direct/${msg.sender_id}`,
              tag: `dm-${msg.sender_id}`,
            });
            return;
          }

          // In-App toast only when app is in foreground
          if (window.location.pathname === `/direct/${msg.sender_id}`) return;

          const senderId = msg.sender_id;
          toast.custom(
            (id) => (
              <div
                onClick={() => {
                  toast.dismiss(id);
                  window.location.href = `/direct/${senderId}`;
                }}
                className="flex items-center gap-3 w-full bg-card border border-border rounded-lg p-3 shadow-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{senderName}</p>
                  <p className="text-xs text-muted-foreground truncate">{preview}</p>
                </div>
              </div>
            ),
            { duration: 4000 }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Group chat notifications — subscribe per group with filter (fixes missing Realtime events)
  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const handleGroupMsg = async (payload: any) => {
      const msg = payload.new as any;
      if (msg.user_id === userId) return;

      const groupChatId = msg.group_chat_id;

      // Fetch sender info and activity title in parallel
      const [{ data: sender }, { data: groupChat }] = await Promise.all([
        supabase.from("users").select("display_name, avatar_url").eq("id", msg.user_id).maybeSingle(),
        supabase.from("activity_group_chats").select("activity_id").eq("id", groupChatId).maybeSingle(),
      ]);

      let activityTitle = t("notif.groupChat");
      if (groupChat?.activity_id) {
        const { data: activity } = await supabase
          .from("activities").select("title").eq("id", groupChat.activity_id).maybeSingle();
        if (activity?.title) activityTitle = activity.title;
      }

      const senderName = sender?.display_name || t("common.unknownUser");
      const avatarUrl = sender?.avatar_url || "";
      let preview = msg.content || "";
      if (msg.media_type === "image") preview = t("notif.sentImage");
      else if (msg.media_type === "audio") preview = t("notif.sentAudio");
      else if (preview.length > 50) preview = preview.substring(0, 50) + "...";

      if (!getNotificationsEnabled()) return;
      if (isGroupMuted(groupChatId)) return;

      const isVisible = document.visibilityState === "visible";

      if (!isVisible) {
        triggerPush({
          userId,
          title: activityTitle,
          body: `${senderName}: ${preview}`,
          url: `/group-chat/${groupChatId}`,
          tag: `group-${groupChatId}`,
        });
        return;
      }

      if (window.location.pathname === `/group-chat/${groupChatId}`) return;

      toast.custom(
        (id) => (
          <div
            onClick={() => { toast.dismiss(id); window.location.href = `/group-chat/${groupChatId}`; }}
            className="flex items-center gap-3 w-full bg-card border border-border rounded-lg p-3 shadow-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {senderName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{activityTitle}</p>
              <p className="text-sm font-semibold text-foreground truncate">{senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{preview}</p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    };

    const setup = async () => {
      // Fetch all group IDs the user is a member of
      const { data: memberships } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", userId);

      if (!memberships || memberships.length === 0) return;

      // Create one channel with a filter per group — ensures Realtime events are received
      const ch = supabase.channel(`group_notif_${userId}`);
      for (const { group_chat_id } of memberships) {
        ch.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "group_chat_messages", filter: `group_chat_id=eq.${group_chat_id}` },
          handleGroupMsg
        );
      }
      ch.subscribe();
      channel = ch;
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  // Notification table events (follow, reel_like, reel_comment, reel_post)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`push_notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const notif = payload.new as any;
          if (notif.actor_id === userId) return;

          const { data: actor } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", notif.actor_id)
            .maybeSingle();

          const actorName = actor?.display_name || t("common.unknownUser");
          let body = "";
          let url = "/notifications";

          switch (notif.type) {
            case "follow":
              body = `${actorName} ${t("notif.follow")}`;
              url = `/user/${notif.actor_id}`;
              break;
            case "reel_like":
              body = `${actorName} ${t("notif.reelLike")}`;
              url = notif.reel_id ? `/reels?startId=${notif.reel_id}` : "/notifications";
              break;
            case "reel_comment":
              body = `${actorName} ${t("notif.reelComment")}`;
              url = notif.reel_id ? `/reels?startId=${notif.reel_id}` : "/notifications";
              break;
            case "reel_post":
              body = `${actorName} ${t("notif.reelPost")}`;
              url = notif.reel_id ? `/reels?startId=${notif.reel_id}` : "/reels";
              break;
          }

          if (body && getNotificationsEnabled() && document.visibilityState === "hidden") {
            triggerPush({
              userId,
              title: APP_NAME,
              body,
              url,
              tag: `notif-${notif.type}-${notif.actor_id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
