import { useState, useEffect, useRef } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Users,
  Loader2,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreateActivityDialog } from "@/components/CreateActivityDialog";
import { usePresence } from "@/hooks/usePresence";

interface GroupChat {
  id: string;
  activity_id: string;
  created_at: string;
  activity: {
    title: string;
    image_url: string | null;
    category: string | null;
  } | null;
  last_message?: {
    content: string;
    created_at: string;
    media_type?: string | null;
  } | null;
  member_count: number;
  has_unread: boolean;
}

interface DirectConversation {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: {
    content: string;
    created_at: string;
    media_type: string | null;
  } | null;
  has_unread: boolean;
}

const Messages = () => {
  const swipe = useSwipeNavigation({ right: "/reels", left: "/profile" });
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDmLoading, setIsDmLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "group" ? "group" : "private";
  const userIdRef = useRef<string | null>(null);
  const initialLoadDone = useRef(false);
  const { t } = useLanguage();
  const onlineUsers = usePresence(currentUserId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoading(false);
        setIsDmLoading(false);
        return;
      }
      userIdRef.current = user.id;
      setCurrentUserId(user.id);
      fetchGroupChats(user.id);
      fetchDirectConversations(user.id);
    });
  }, []);

  useEffect(() => {
    const dmChannel = supabase
      .channel("messages-page-dm")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        () => { if (userIdRef.current) fetchDirectConversations(userIdRef.current); }
      )
      .subscribe();

    const groupChannel = supabase
      .channel("messages-page-group")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_messages" },
        () => { if (userIdRef.current) fetchGroupChats(userIdRef.current); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(groupChannel);
    };
  }, []);

  const fetchGroupChats = async (userId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setGroupChats([]);
        setIsLoading(false);
        return;
      }

      const groupChatIds = memberData.map(m => m.group_chat_id);

      const { data: chatsData, error: chatsError } = await supabase
        .from("activity_group_chats")
        .select(`id, activity_id, created_at, activities (title, image_url, category)`)
        .in("id", groupChatIds);

      if (chatsError) throw chatsError;
      if (!chatsData || chatsData.length === 0) {
        setGroupChats([]);
        setIsLoading(false);
        return;
      }

      const { data: allLastReads } = await supabase
        .from("group_chat_last_read")
        .select("group_chat_id, last_read_at")
        .eq("user_id", userId)
        .in("group_chat_id", groupChatIds);

      const lastReadMap = new Map(
        (allLastReads || []).map(r => [r.group_chat_id, r.last_read_at])
      );

      const [memberCountResults, lastMessageResults] = await Promise.all([
        Promise.all(groupChatIds.map(id =>
          supabase
            .from("group_chat_members")
            .select("*", { count: "exact", head: true })
            .eq("group_chat_id", id)
            .then(r => ({ id, count: r.count || 0 }))
        )),
        Promise.all(groupChatIds.map(id =>
          supabase
            .from("group_chat_messages")
            .select("content, created_at, media_type")
            .eq("group_chat_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => ({ id, msg: r.data }))
        )),
      ]);

      const memberCountMap = new Map(memberCountResults.map(r => [r.id, r.count]));
      const lastMsgMap = new Map(lastMessageResults.map(r => [r.id, r.msg]));

      const enrichedChats: GroupChat[] = chatsData.map(chat => {
        const lastMsg = lastMsgMap.get(chat.id);
        const lastReadAt = lastReadMap.get(chat.id);
        let hasUnread = false;
        if (lastMsg) {
          hasUnread = !lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt);
        }

        return {
          id: chat.id,
          activity_id: chat.activity_id,
          created_at: chat.created_at,
          activity: chat.activities as GroupChat["activity"],
          last_message: lastMsg,
          member_count: memberCountMap.get(chat.id) || 0,
          has_unread: hasUnread,
        };
      });

      setGroupChats(enrichedChats);
    } catch (error) {
      console.error("Error fetching group chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectConversations = async (userId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("direct_messages")
        .select("sender_id, receiver_id, content, created_at, media_type, read_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (!messages || messages.length === 0) {
        setDirectConversations([]);
        setIsDmLoading(false);
        return;
      }

      const conversationMap = new Map<string, {
        other_user_id: string;
        last_message: typeof messages[0];
        has_unread: boolean;
      }>();

      messages.forEach((msg) => {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (otherUserId === userId) return;
        if (!conversationMap.has(otherUserId)) {
          const isUnread = msg.sender_id !== userId && !msg.read_at;
          conversationMap.set(otherUserId, {
            other_user_id: otherUserId,
            last_message: msg,
            has_unread: isUnread,
          });
        }
      });

      const otherUserIds = Array.from(conversationMap.keys());
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", otherUserIds);

      const usersMap = new Map(
        (usersData || []).map(u => [u.id, u])
      );

      const conversations: DirectConversation[] = otherUserIds.map(uid => {
        const conv = conversationMap.get(uid)!;
        const userData = usersMap.get(uid);
        return {
          other_user_id: uid,
          other_user_name: userData?.display_name || t("messages.user"),
          other_user_avatar: userData?.avatar_url || null,
          last_message: {
            content: conv.last_message.content,
            created_at: conv.last_message.created_at,
            media_type: conv.last_message.media_type,
          },
          has_unread: conv.has_unread,
        };
      });

      conversations.sort((a, b) => {
        const aTime = a.last_message?.created_at || "";
        const bTime = b.last_message?.created_at || "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setDirectConversations(conversations);
    } catch (error) {
      console.error("Error fetching direct conversations:", error);
    } finally {
      setIsDmLoading(false);
    }
  };

  const sortedGroupChats = [...groupChats].sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("messages.justNow");
    if (diffMins < 60) return `${diffMins} ${t("messages.minutesAgo")}`;
    if (diffHours < 24) return `${diffHours} ${t("messages.hoursAgo")}`;
    return `${diffDays}d`;
  };

  const renderLastMessage = (msg: { content: string; media_type?: string | null } | null) => {
    if (!msg) return t("messages.noMessages");
    if (msg.media_type === "image") return t("messages.sentImage");
    if (msg.media_type === "audio") return t("messages.sentAudio");
    return msg.content || t("messages.noMessages");
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden" {...swipe}>
      <header className="flex-shrink-0 px-4 py-4 bg-card border-b border-border" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <h1 className="text-xl font-bold">{t("messages.title")}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border border-border rounded-full p-1 h-auto">
            <TabsTrigger 
              value="private" 
              className="flex items-center gap-2 rounded-full py-2 px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground"
            >
              <MessageSquare className="w-4 h-4" />
              {t("messages.private")}
            </TabsTrigger>
            <TabsTrigger 
              value="group" 
              className="flex items-center gap-2 rounded-full py-2 px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground"
            >
              <Users className="w-4 h-4" />
              {t("messages.group")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="private" className="mt-4">
            {isDmLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : directConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t("messages.noPrivate")}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t("messages.startConversation")}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {directConversations.map((conv) => (
                  <div
                    key={conv.other_user_id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/direct/${conv.other_user_id}`)}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.other_user_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.other_user_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(conv.other_user_id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {conv.other_user_name}
                          </h4>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.last_message?.created_at 
                            ? formatTimeAgo(conv.last_message.created_at)
                            : ""}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${conv.has_unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {renderLastMessage(conv.last_message)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="group" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedGroupChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t("messages.noGroups")}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t("messages.joinToChat")}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedGroupChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/group-chat/${chat.id}`)}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={chat.activity?.image_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {chat.activity?.title?.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {chat.activity?.title || t("messages.group")}
                          </h4>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {chat.last_message?.created_at 
                            ? formatTimeAgo(chat.last_message.created_at)
                            : ""}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${chat.has_unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {renderLastMessage(chat.last_message)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav
        centerButton={
          <CreateActivityDialog
            selectedProvince=""
            onActivityCreated={() => {}}
            trigger={
              <button className="p-3 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Plus className="w-6 h-6" />
              </button>
            }
          />
        }
      />
    </div>
  );
};

export default Messages;
