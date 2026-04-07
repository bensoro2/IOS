import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getIntlLocale } from "@/lib/dateLocale";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Flag, Bell, BellOff } from "lucide-react";
import { MoreVertical, Ban, UserX } from "lucide-react";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";
import { BUCKET_CHAT_MEDIA, CHAT_POLL_INTERVAL_MS, CHAT_POLL_MAX_MS, SCROLL_TO_BOTTOM_DELAY_MS } from "@/config/defaults";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { Button } from "@/components/ui/button";
 import { toast } from "sonner";
import { ReportUserSheet } from "@/components/ReportUserSheet";
import { useDmNotificationMute } from "@/hooks/useGroupNotificationMute";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_display_name?: string;
  user_avatar?: string;
  media_url?: string | null;
  media_type?: string | null;
  reply_to_id?: string | null;
  reply_preview?: string | null;
  reactions?: Record<string, string[]> | null;
  is_deleted?: boolean;
}

interface OtherUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const DirectChat = () => {
  const { language, t } = useLanguage();
  const { odirectId } = useParams<{ odirectId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; preview: string } | null>(null);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [showReportSheet, setShowReportSheet] = useState(false);
  const { muted: isDmMuted, toggle: toggleDmMute } = useDmNotificationMute(odirectId || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: instant ? "auto" : "smooth" 
    });
  };

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Mark DMs from other user as read
  const markDmAsRead = async (userId: string, otherUserId: string) => {
    try {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", userId)
        .is("read_at", null);
    } catch (error) {
      console.error("Error marking DMs as read:", error);
    }
  };

  useEffect(() => {
    let currentUid: string | null = null;
    let isActive = true;
    let pollTimeoutId: ReturnType<typeof setTimeout>;
    let pollInterval = CHAT_POLL_INTERVAL_MS;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      currentUid = user.id;
      setCurrentUserId(user.id);
      
      if (!odirectId || odirectId === user.id) {
        navigate("/messages");
        return;
      }

      // Run all init queries in parallel
      const [, , , blockResult] = await Promise.all([
        fetchOtherUser(odirectId),
        fetchMessages(user.id, odirectId),
        markDmAsRead(user.id, odirectId),
        supabase
          .from("blocks")
          .select("id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", odirectId)
          .maybeSingle(),
      ]);
       
       setIsBlockedByMe(!!blockResult.data);
       
      setIsLoading(false);
      setTimeout(() => scrollToBottom(true), SCROLL_TO_BOTTOM_DELAY_MS);

      // Start polling fallback
      if (isActive) startPolling(user.id, odirectId);
    };

    const startPolling = (uid: string, otherUid: string) => {
      const poll = async () => {
        if (!isActive) return;
        try {
          const { data } = await supabase
            .from("direct_messages")
            .select("*")
            .or(`and(sender_id.eq.${uid},receiver_id.eq.${otherUid}),and(sender_id.eq.${otherUid},receiver_id.eq.${uid})`)
            .order("created_at", { ascending: true });

          if (data && data.length > 0) {
            setMessages((prev) => {
              const prevIds = new Set(prev.filter(m => !m.id.startsWith("temp-")).map(m => m.id));
              const hasNew = data.some(m => !prevIds.has(m.id));
              const prevMap = new Map(prev.map(m => [m.id, m]));
              const hasUpdates = data.some(m => {
                const p = prevMap.get(m.id);
                if (!p) return false;
                return p.is_deleted !== (m.is_deleted ?? false) ||
                  JSON.stringify(p.reactions) !== JSON.stringify(m.reactions);
              });

              if (!hasNew && !hasUpdates && prev.filter(m => !m.id.startsWith("temp-")).length === data.length) {
                pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
                return prev;
              }

              pollInterval = CHAT_POLL_INTERVAL_MS;

              const remainingTemp = prev.filter(m => m.id.startsWith("temp-") && !data.some(
                d => d.sender_id === m.user_id && d.content === m.content
              ));

              const enriched: Message[] = data.map(msg => ({
                id: msg.id,
                content: msg.content,
                user_id: msg.sender_id,
                created_at: msg.created_at,
                user_display_name: prevMap.get(msg.id)?.user_display_name || t("common.unknownUser"),
                user_avatar: prevMap.get(msg.id)?.user_avatar,
                media_url: msg.media_url,
                media_type: msg.media_type,
                reply_to_id: msg.reply_to_id ?? null,
                reply_preview: msg.reply_preview ?? null,
                reactions: (msg.reactions as Record<string, string[]>) ?? null,
                is_deleted: msg.is_deleted ?? false,
              }));

              return [...enriched, ...remainingTemp].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else {
            pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
          }
        } catch (err) {
          console.error("DM poll error:", err);
          pollInterval = Math.min(pollInterval * 1.5, CHAT_POLL_MAX_MS);
        }
        if (isActive) pollTimeoutId = setTimeout(poll, pollInterval);
      };
      pollTimeoutId = setTimeout(poll, pollInterval);
    };

    init();

    // Realtime subscription
    const channel = supabase
      .channel(`direct-chat-${odirectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${odirectId}`,
        },
        (payload) => { pollInterval = CHAT_POLL_INTERVAL_MS; handleNewDm(payload, currentUid); }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `sender_id=eq.${odirectId}`,
        },
        (payload) => { pollInterval = CHAT_POLL_INTERVAL_MS; handleNewDm(payload, currentUid); }
      )
      .subscribe();

    function handleNewDm(payload: any, uid: string | null) {
      if (!uid) return;
      const newMsg = payload.new as {
        id: string;
        content: string;
        sender_id: string;
        receiver_id: string;
        created_at: string;
        media_url?: string | null;
        media_type?: string | null;
        reply_to_id?: string | null;
        reply_preview?: string | null;
        reactions?: Record<string, string[]> | null;
        is_deleted?: boolean;
      };

      const isRelevant =
        (newMsg.sender_id === uid && newMsg.receiver_id === odirectId) ||
        (newMsg.sender_id === odirectId && newMsg.receiver_id === uid);

      if (!isRelevant) return;

      supabase
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", newMsg.sender_id)
        .maybeSingle()
        .then(({ data: userData }) => {
          const enrichedMessage: Message = {
            id: newMsg.id,
            content: newMsg.content,
            user_id: newMsg.sender_id,
            created_at: newMsg.created_at,
            user_display_name: userData?.display_name || t("common.unknownUser"),
            user_avatar: userData?.avatar_url || undefined,
            media_url: newMsg.media_url,
            media_type: newMsg.media_type,
            reply_to_id: newMsg.reply_to_id ?? null,
            reply_preview: newMsg.reply_preview ?? null,
            reactions: (newMsg.reactions as Record<string, string[]>) ?? null,
            is_deleted: (newMsg as any).is_deleted ?? false,
          };

          setMessages((prev) => {
            const existingIndex = prev.findIndex((msg) => msg.id === newMsg.id);
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = enrichedMessage;
              return updated;
            }

            const tempIndex = prev.findIndex(
              (msg) =>
                msg.id.startsWith("temp-") &&
                msg.user_id === newMsg.sender_id &&
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

    return () => {
      isActive = false;
      clearTimeout(pollTimeoutId);
      supabase.removeChannel(channel);
    };
  }, [odirectId, navigate]);

  const fetchOtherUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setOtherUser(data);
    }
  };

  const fetchMessages = async (currentUid: string, otherUid: string) => {
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUid},receiver_id.eq.${otherUid}),and(sender_id.eq.${otherUid},receiver_id.eq.${currentUid})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user info for both participants in one batch instead of per-message
      const userIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const userMap = new Map(
        (usersData || []).map(u => [u.id, u])
      );

      const enrichedMessages: Message[] = (data || []).map(msg => {
        const userData = userMap.get(msg.sender_id);
        return {
          id: msg.id,
          content: msg.content,
          user_id: msg.sender_id,
          created_at: msg.created_at,
          user_display_name: userData?.display_name || t("common.unknownUser"),
          user_avatar: userData?.avatar_url || undefined,
          media_url: msg.media_url,
          media_type: msg.media_type,
          reply_to_id: msg.reply_to_id ?? null,
          reply_preview: msg.reply_preview ?? null,
          reactions: (msg.reactions as Record<string, string[]>) ?? null,
          is_deleted: msg.is_deleted ?? false,
        };
      });

      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const uploadMedia = async (file: Blob, type: "image" | "audio"): Promise<string | null> => {
    if (!currentUserId) return null;

    const ext = type === "image" ? "jpg" : "webm";
    const fileName = `dm/${currentUserId}/${Date.now()}.${ext}`;

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

   const handleBlockUser = async () => {
     if (!currentUserId || !odirectId) return;
     
     setIsBlocking(true);
     try {
       const { error } = await supabase
         .from("blocks")
         .insert({
           blocker_id: currentUserId,
           blocked_id: odirectId,
         });
 
       if (error) throw error;
 
       toast.success(t("directChat.blockSuccess").replace("{name}", otherUser?.display_name || t("common.unknownUser")));
       setIsBlockedByMe(true);
     } catch (error: any) {
       console.error("Error blocking user:", error);
       if (error.code === "23505") {
         toast.error(t("directChat.alreadyBlocked"));
       } else {
         toast.error(t("common.error"));
       }
     } finally {
       setIsBlocking(false);
       setShowBlockDialog(false);
     }
   };
 
  const sendTextMessage = async (text: string) => {
    if (!currentUserId || !odirectId) return;

    setIsSending(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: text,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      user_display_name: t("common.you"),
      user_avatar: undefined,
      reply_to_id: replyTo?.id ?? null,
      reply_preview: replyTo?.preview ?? null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setReplyTo(null);

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: odirectId,
          content: text,
          reply_to_id: replyTo?.id ?? null,
          reply_preview: replyTo?.preview ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...msg, id: data.id, user_id: data.sender_id }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const sendMediaMessage = async (file: Blob, type: "image" | "audio") => {
    if (!currentUserId || !odirectId) return;

    setIsSending(true);

    const mediaUrl = await uploadMedia(file, type);
    if (!mediaUrl) {
      setIsSending(false);
      return;
    }

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: "",
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      user_display_name: t("common.you"),
      user_avatar: undefined,
      media_url: mediaUrl,
      media_type: type,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: odirectId,
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
              ? { ...msg, id: data.id, user_id: data.sender_id }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending media message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (message: Message) => {
    const preview = message.content || (message.media_type === "image" ? t("chat.image") : message.media_type === "audio" ? t("chat.audio") : t("chat.message"));
    setReplyTo({ id: message.id, preview: preview.slice(0, 80) });
  };

  const handleDelete = async (messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_deleted: true } : m));
    const { error } = await supabase.from("direct_messages").update({ is_deleted: true }).eq("id", messageId);
    if (error) {
      console.error("Delete error:", error);
      toast.error(t("chat.deleteError") + " " + error.message);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, is_deleted: false } : m));
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
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
    await supabase.from("direct_messages").update({ reactions }).eq("id", messageId);
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button
          onClick={() => navigate("/messages?tab=private")}
          className="p-2 -ml-2 rounded-full hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar 
          className="w-10 h-10 cursor-pointer"
          onClick={() => otherUser && navigate(`/user/${otherUser.id}`)}
        >
          <AvatarImage src={otherUser?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {otherUser?.display_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 
            className="font-semibold truncate cursor-pointer hover:underline"
            onClick={() => otherUser && navigate(`/user/${otherUser.id}`)}
          >
            {otherUser?.display_name || t("common.user")}
          </h1>
        </div>
         
         {/* More Options Menu */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="shrink-0">
               <MoreVertical className="w-5 h-5" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const next = toggleDmMute();
                  toast.success(next ? t("directChat.dmMutedToast") : t("directChat.dmUnmutedToast"));
                }}
              >
                {isDmMuted ? (
                  <BellOff className="w-4 h-4 mr-2 text-muted-foreground" />
                ) : (
                  <Bell className="w-4 h-4 mr-2 text-primary" />
                )}
                {isDmMuted ? t("groupChat.unmuteNotif") : t("groupChat.muteNotif")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowReportSheet(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                {t("directChat.reportUser")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowBlockDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                {t("directChat.blockUser")}
              </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <p className="text-muted-foreground">{t("directChat.noMessages")}</p>
            <p className="text-sm text-muted-foreground">
              {t("directChat.startChat")} {otherUser?.display_name || t("common.user")}
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
              onReply={handleReply}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
       {isBlockedByMe ? (
         <div className="flex-shrink-0 px-4 py-3 bg-card border-t border-border">
            <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground bg-muted rounded-lg">
              <Ban className="w-4 h-4" />
              <span className="text-sm">{t("directChat.youBlockedUser")}</span>
            </div>
         </div>
       ) : (
         <ChatInput
           onSendText={sendTextMessage}
           onSendMedia={sendMediaMessage}
           isSending={isSending}
           replyTo={replyTo}
           onCancelReply={() => setReplyTo(null)}
         />
       )}
       
       {/* Block Confirmation Dialog */}
       <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-destructive" />
                {t("directChat.blockConfirmTitle")} {otherUser?.display_name || t("common.user")}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("userProfile.blockConfirmDesc1")}
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t("userProfile.blockItem1")}</li>
                  <li>{t("userProfile.blockItem2")}</li>
                  <li>{t("userProfile.blockItem3")}</li>
                </ul>
                <p className="mt-3">{t("userProfile.blockNote")}</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBlocking}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isBlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("common.block")}
              </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
       
       {/* Report User Sheet */}
       {otherUser && (
         <ReportUserSheet
           reportedUserId={otherUser.id}
           reportedUserName={otherUser.display_name || t("common.user")}
           open={showReportSheet}
           onOpenChange={setShowReportSheet}
         />
       )}
    </div>
  );
};

export default DirectChat;
