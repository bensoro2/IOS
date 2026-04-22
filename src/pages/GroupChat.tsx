import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getIntlLocale } from "@/lib/dateLocale";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, MoreVertical, MapPin, Bell, BellOff, Users, LogOut, Check } from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BUCKET_CHAT_MEDIA, CHAT_POLL_INTERVAL_MS, CHAT_POLL_MAX_MS, SCROLL_TO_BOTTOM_DELAY_MS } from "@/config/defaults";
 import GroupMembersDialog from "@/components/GroupMembersDialog";
import { useGroupNotificationMute } from "@/hooks/useGroupNotificationMute";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_display_name?: string;
  user_avatar?: string;
  media_url?: string | null;
  media_type?: string | null;
  is_deleted?: boolean;
  reactions?: Record<string, string[]> | null;
  reply_to_id?: string | null;
  reply_preview?: string | null;
}

interface ActivityInfo {
  title: string;
  image_url: string | null;
  category: string | null;
}

const GroupChat = () => {
  const { language, t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activityInfo, setActivityInfo] = useState<ActivityInfo | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const { muted: isGroupMuted, toggle: toggleGroupMute } = useGroupNotificationMute(id || "");

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: instant ? "auto" : "smooth" 
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Mark group chat as read
  const markGroupChatAsRead = async (userId: string, groupChatId: string) => {
    try {
      const { data: existing } = await supabase
        .from("group_chat_last_read")
        .select("id")
        .eq("user_id", userId)
        .eq("group_chat_id", groupChatId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("group_chat_last_read")
          .update({ last_read_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("group_chat_id", groupChatId);
      } else {
        await supabase
          .from("group_chat_last_read")
          .insert({ user_id: userId, group_chat_id: groupChatId, last_read_at: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Error marking group chat as read:", error);
    }
  };

  useEffect(() => {
    let isActive = true;
    let pollTimeoutId: ReturnType<typeof setTimeout>;
    let pollInterval = CHAT_POLL_INTERVAL_MS;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      const category = await fetchChatInfo();
      await fetchMessages();
      await checkTodayCheckin(user.id, category);
      if (id) {
        await markGroupChatAsRead(user.id, id);
      }
      setIsLoading(false);
      setTimeout(() => scrollToBottom(true), SCROLL_TO_BOTTOM_DELAY_MS);

      // Start polling fallback
      if (isActive && id) startPolling();
    };

    const startPolling = () => {
      const poll = async () => {
        if (!isActive) return;
        try {
          const { data } = await supabase
            .from("group_chat_messages")
            .select("*")
            .eq("group_chat_id", id)
            .order("created_at", { ascending: true });

          if (data && data.length > 0) {
            setMessages((prev) => {
              const prevIds = new Set(prev.filter(m => !m.id.startsWith("temp-")).map(m => m.id));
              const hasNew = data.some(m => !prevIds.has(m.id));

              if (!hasNew && prev.filter(m => !m.id.startsWith("temp-")).length === data.length) {
                pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
                return prev;
              }

              pollInterval = CHAT_POLL_INTERVAL_MS;

              const remainingTemp = prev.filter(m => m.id.startsWith("temp-") && !data.some(
                d => d.user_id === m.user_id && d.content === m.content
              ));

              const enriched: Message[] = data.map(msg => ({
                id: msg.id,
                content: msg.content,
                user_id: msg.user_id,
                created_at: msg.created_at,
                user_display_name: prev.find(p => p.id === msg.id)?.user_display_name || t("common.unknownUser"),
                user_avatar: prev.find(p => p.id === msg.id)?.user_avatar,
                media_url: msg.media_url,
                media_type: msg.media_type,
              }));

              return [...enriched, ...remainingTemp].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else {
            pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
          }
        } catch (err) {
          console.error("Group poll error:", err);
          pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
        }
        if (isActive) pollTimeoutId = setTimeout(poll, pollInterval);
      };
      pollTimeoutId = setTimeout(poll, pollInterval);
    };

    init();

    // Realtime subscription
    const channel = supabase
      .channel(`group-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_chat_id=eq.${id}`,
        },
        (payload) => {
          pollInterval = CHAT_POLL_INTERVAL_MS;
          const newMsg = payload.new as {
            id: string;
            content: string;
            user_id: string;
            created_at: string;
            media_url?: string | null;
            media_type?: string | null;
          };
          
          supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .maybeSingle()
            .then(({ data: userData }) => {
              const enrichedMessage: Message = {
                ...newMsg,
                user_display_name: userData?.display_name || t("common.unknownUser"),
                user_avatar: userData?.avatar_url || undefined,
              };

              setMessages((prev) => {
                const existingIndex = prev.findIndex((msg) => msg.id === newMsg.id);
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = enrichedMessage;
                  return updated;
                }
                
                const tempIndex = prev.findIndex(
                  (msg) => msg.id.startsWith("temp-") && 
                           msg.user_id === newMsg.user_id && 
                           msg.content === newMsg.content
                );
                if (tempIndex !== -1) {
                  const updated = [...prev];
                  updated[tempIndex] = enrichedMessage;
                  return updated;
                }
                
                return [...prev, enrichedMessage];
              });
            });
        }
      )
      .subscribe();

    // Listen for membership removal (kick)
    const memberChannel = supabase
      .channel(`group-member-kick-${id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_chat_members",
          filter: `group_chat_id=eq.${id}`,
        },
        (payload) => {
          const deleted = payload.old as { user_id?: string };
          if (deleted.user_id === currentUserId) {
            toast.error(t("groupChat.kickedToast"));
            navigate("/messages");
          } else {
            // Update member count when someone else is removed
            setMemberCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      clearTimeout(pollTimeoutId);
      supabase.removeChannel(channel);
      supabase.removeChannel(memberChannel);
    };
  }, [id, navigate]);

  const checkTodayCheckin = async (userId: string, category?: string | null) => {
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

      // Check activity group check-ins
      const { data: activityData, error: activityError } = await supabase
        .from("activity_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("checked_in_at", today)
        .maybeSingle();

      if (activityError) throw activityError;

      if (activityData) {
        setHasCheckedInToday(true);
        return;
      }

      // Also check fast check-ins for the same category
      if (category) {
        const { data: fastData, error: fastError } = await supabase
          .from("fast_checkins")
          .select("id")
          .eq("user_id", userId)
          .eq("category", category)
          .eq("checked_in_at", today)
          .maybeSingle();

        if (fastError) throw fastError;
        setHasCheckedInToday(!!fastData);
      } else {
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error("Error checking today's checkin:", error);
    }
  };

  const handleCheckin = async () => {
    if (!currentUserId || !id || hasCheckedInToday) return;

    setIsCheckingIn(true);
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      
      // Get the category from activityInfo
      const category = activityInfo?.category || null;
      
      const { error } = await supabase
        .from("activity_checkins")
        .insert({
          user_id: currentUserId,
          group_chat_id: id,
          checked_in_at: today,
          category: category,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(t("groupChat.alreadyCheckedIn"));
          setHasCheckedInToday(true);
        } else {
          throw error;
        }
      } else {
        toast.success(t("groupChat.checkinSuccess"), {
          description: t("groupChat.checkinSuccessDesc"),
        });
        setHasCheckedInToday(true);
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error(t("groupChat.checkinError"));
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleLeaveChat = async () => {
    if (!currentUserId || !id) return;

    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_chat_id", id)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast.success(t("groupChat.leftToast"));
      navigate("/messages");
    } catch (error) {
      console.error("Error leaving chat:", error);
      toast.error(t("groupChat.leaveError"));
    } finally {
      setIsLeaving(false);
    }
  };

  const fetchChatInfo = async (): Promise<string | null> => {
    try {
      // Get activity info
      const { data: chatData } = await supabase
        .from("activity_group_chats")
        .select(`
          activity_id,
          created_by,
          activities (
            title,
            image_url,
            category
          )
        `)
        .eq("id", id)
        .single();

      if (chatData?.activities) {
        setActivityInfo(chatData.activities as ActivityInfo);
      }

      // Set owner id
      if (chatData?.created_by) {
        setOwnerId(chatData.created_by);
      }

      // Get member count
      const { count } = await supabase
        .from("group_chat_members")
        .select("*", { count: "exact", head: true })
        .eq("group_chat_id", id);

      setMemberCount(count || 0);
      return (chatData?.activities as ActivityInfo | null)?.category ?? null;
    } catch (error) {
      console.error("Error fetching chat info:", error);
      return null;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("group_chat_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Enrich messages with user info
      const enrichedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: userData } = await supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", msg.user_id)
            .maybeSingle();

          return {
            ...msg,
            user_display_name: userData?.display_name || t("common.unknownUser"),
            user_avatar: userData?.avatar_url || undefined,
          };
        })
      );

      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const uploadMedia = async (file: Blob, type: "image" | "audio"): Promise<string | null> => {
    if (!currentUserId) return null;

    const ext = type === "image" ? "jpg" : "webm";
    const fileName = `${currentUserId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_CHAT_MEDIA)
      .upload(fileName, file, {
        contentType: type === "image" ? "image/jpeg" : "audio/webm",
      });

    if (error) {
      console.error("Error uploading media:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_CHAT_MEDIA)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const sendTextMessage = async (text: string) => {
    if (!currentUserId || !id) return;

    setIsSending(true);

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: text,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      user_display_name: t("common.you"),
      user_avatar: undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from("group_chat_messages")
        .insert({
          group_chat_id: id,
          user_id: currentUserId,
          content: text,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      if (data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...data, user_display_name: t("common.you"), user_avatar: undefined }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const sendMediaMessage = async (file: Blob | Blob[], type: "image" | "audio") => {
    if (!currentUserId || !id) return;

    const files = Array.isArray(file) ? file : [file];
    setIsSending(true);

    try {
      const urls = await Promise.all(files.map((f) => uploadMedia(f, type)));
      const validUrls = urls.filter(Boolean) as string[];

      await Promise.all(
        validUrls.map(async (mediaUrl, i) => {
          const optimisticMessage: Message = {
            id: `temp-${Date.now()}-${i}`,
            content: "",
            user_id: currentUserId,
            created_at: new Date().toISOString(),
            user_display_name: t("common.you"),
            user_avatar: undefined,
            media_url: mediaUrl,
            media_type: type,
          };

          setMessages((prev) => [...prev, optimisticMessage]);

          const { data, error } = await supabase
            .from("group_chat_messages")
            .insert({
              group_chat_id: id,
              user_id: currentUserId,
              content: "",
              media_url: mediaUrl,
              media_type: type,
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === optimisticMessage.id
                  ? { ...data, user_display_name: t("common.you"), user_avatar: undefined }
                  : msg
              )
            );
          }
        })
      );
    } catch (error) {
      console.error("Error sending media message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_deleted: true } : m));
    const { error } = await supabase.from("group_chat_messages").update({ is_deleted: true }).eq("id", messageId);
    if (error) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_deleted: false } : m));
      toast.error(error.message);
    }
  };

  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (!currentUserId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const reactions: Record<string, string[]> = { ...(msg.reactions || {}) };
    const users = reactions[emoji] ? [...reactions[emoji]] : [];
    const idx = users.indexOf(currentUserId);
    if (idx >= 0) users.splice(idx, 1);
    else users.push(currentUserId);
    reactions[emoji] = users;
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions } : m));
    await supabase.from("group_chat_messages").update({ reactions }).eq("id", messageId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(getIntlLocale(language), {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header - Fixed */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={() => navigate("/messages")}
          className="p-2 -ml-2 rounded-full hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={activityInfo?.image_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {activityInfo?.title?.charAt(0) || "G"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">
            {activityInfo?.title || t("groupChat.defaultTitle")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {memberCount} {t("members.membersLabel")}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 -mr-2 rounded-full hover:bg-accent">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleCheckin}
              disabled={hasCheckedInToday || isCheckingIn}
              className={hasCheckedInToday ? "text-muted-foreground" : ""}
            >
              {isCheckingIn ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : hasCheckedInToday ? (
                <Check className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <MapPin className="w-4 h-4 mr-2 text-primary" />
              )}
              {hasCheckedInToday ? t("groupChat.checkedInToday") : t("groupChat.checkin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const next = toggleGroupMute();
              toast.success(next ? t("groupChat.mutedToast") : t("groupChat.unmutedToast"));
            }}>
              {isGroupMuted ? (
                <BellOff className="w-4 h-4 mr-2 text-muted-foreground" />
              ) : (
                <Bell className="w-4 h-4 mr-2 text-primary" />
              )}
              {isGroupMuted ? t("groupChat.unmuteNotif") : t("groupChat.muteNotif")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMembersDialog(true)}>
              <Users className="w-4 h-4 mr-2 text-primary" />
              {t("groupChat.viewMembers")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLeaveChat}
              disabled={isLeaving}
              className="text-destructive focus:text-destructive"
            >
              {isLeaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {isLeaving ? t("groupChat.leaving") : t("groupChat.leaveChat")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages - Scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <p className="text-muted-foreground">{t("messages.noMessages")}</p>
            <p className="text-sm text-muted-foreground">
              {t("groupChat.startConversation")}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
              formatTime={formatTime}
              currentUserId={currentUserId ?? undefined}
              onDelete={handleDeleteMessage}
              onReply={(msg) => setReplyTo(msg)}
              onReact={handleReactMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <ChatInput
        onSendText={sendTextMessage}
        onSendMedia={sendMediaMessage}
        isSending={isSending}
      />

      {/* Members Dialog */}
      <GroupMembersDialog
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        groupChatId={id || ""}
        ownerId={ownerId}
        currentUserId={currentUserId}
        onMemberKicked={() => setMemberCount((prev) => Math.max(0, prev - 1))}
      />
    </div>
  );
};

export default GroupChat;
