import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Heart, MessageCircle, UserPlus, Film } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDateLocale } from "@/lib/dateLocale";

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  reel_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Notifications = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      fetchNotifications(user.id);
    });
  }, []);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50) as any;

      if (error) throw error;

      if (!data || data.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Fetch actor info
      const actorIds = [...new Set(data.map((n: any) => n.actor_id))] as string[];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", actorIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      const enriched: Notification[] = data.map((n: any) => ({
        ...n,
        actor: usersMap.get(n.actor_id) || undefined,
      }));

      setNotifications(enriched);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("user_id", userId)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case "reel_like":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "reel_comment":
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case "reel_post":
        return <Film className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case "follow": return t("notif.follow");
      case "reel_like": return t("notif.reelLike");
      case "reel_comment": return t("notif.reelComment");
      case "reel_post": return t("notif.reelPost");
      default: return "";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "follow") {
      navigate(`/user/${notification.actor_id}`);
    } else if (notification.reel_id) {
      navigate(`/reels?startId=${notification.reel_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      <header className="flex items-center px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold">{t("notifications.title")}</h1>
      </header>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.actor?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {notification.actor?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {notification.actor?.display_name || t("common.unknownUser")}
                    </span>{" "}
                    {getNotificationText(notification.type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: getDateLocale(language),
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Notifications;
