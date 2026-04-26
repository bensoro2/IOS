import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Reply, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

export interface Message {
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
  read_at?: string | null;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (dateString: string) => string;
  currentUserId?: string;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  showReadReceipt?: boolean;
  otherUserAvatar?: string | null;
  otherUserName?: string | null;
  swipeOffset?: number;
}

const AudioPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const durationResolvedRef = useRef(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    durationResolvedRef.current = false;
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const setDurationIfValid = (value: number) => {
    if (!isFinite(value) || isNaN(value) || value <= 0) return false;
    setDuration(value);
    durationResolvedRef.current = true;
    return true;
  };

  const resolveDurationFromBuffer = async () => {
    if (durationResolvedRef.current) return;
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        setDurationIfValid(audioBuffer.duration);
      } finally {
        await audioContext.close();
      }
    } catch (error) {
      console.warn("Unable to decode audio duration:", error);
    }
  };

  const handleDurationMetadata = (audioEl: HTMLAudioElement) => {
    if (setDurationIfValid(audioEl.duration)) return;

    if (audioEl.duration === Infinity) {
      const handleSeeked = () => {
        setDurationIfValid(audioEl.duration);
        audioEl.currentTime = 0;
      };
      audioEl.addEventListener("seeked", handleSeeked, { once: true });
      try {
        audioEl.currentTime = 1e9;
      } catch {
        void resolveDurationFromBuffer();
      }
      return;
    }

    void resolveDurationFromBuffer();
  };

  return (
    <div className="flex items-center gap-2 min-w-[150px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => handleDurationMetadata(e.currentTarget)}
        onDurationChange={(e) => {
          if (!durationResolvedRef.current) {
            handleDurationMetadata(e.currentTarget);
          }
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }} />
        </div>
        <span className="text-xs opacity-70">{fmt(currentTime)} / {fmt(duration || 0)}</span>
      </div>
    </div>
  );
};

const REEL_URL_REGEX = /https?:\/\/[^\s]+\/reels\?startId=([a-f0-9-]{36})/;

const ReelPreviewCard = ({ reelId, isOwn }: { reelId: string; isOwn: boolean }) => {
  const navigate = useNavigate();
  const [reel, setReel] = useState<{ video_url: string; description: string | null; user_display_name: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from("reels")
      .select("video_url, description, user_id")
      .eq("id", reelId)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: userData } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", data.user_id)
          .single();
        setReel({
          video_url: data.video_url,
          description: data.description,
          user_display_name: userData?.display_name ?? null,
        });
      });
  }, [reelId]);

  if (!reel) return <div className="w-48 h-24 rounded-xl bg-muted/50 animate-pulse" />;

  return (
    <button
      onClick={() => navigate(`/reels?startId=${reelId}`)}
      className={`block rounded-xl overflow-hidden border border-border w-52 text-left ${isOwn ? "border-primary/30" : ""}`}
    >
      <div className="relative w-full" style={{ aspectRatio: "9/16", maxHeight: 200 }}>
        <video
          src={reel.video_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
      </div>
      <div className={`px-2 py-1.5 ${isOwn ? "bg-primary/10" : "bg-muted"}`}>
        <p className="text-xs font-medium truncate">{reel.user_display_name || "Reel"}</p>
        {reel.description && <p className="text-xs opacity-70 truncate">{reel.description}</p>}
      </div>
    </button>
  );
};

const urlRegex = /(https?:\/\/[^\s]+)/g;
const isInternalLink = (url: string) => {
  try { return new URL(url).origin === window.location.origin; } catch { return false; }
};

const InternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const navigate = useNavigate();
  const parsed = new URL(href);
  return (
    <a href={href} className="underline break-all" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(parsed.pathname + parsed.search + parsed.hash); }}>
      {children}
    </a>
  );
};

const renderTextWithLinks = (text: string) => {
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      if (isInternalLink(part)) return <InternalLink key={i} href={part}>{part}</InternalLink>;
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" onClick={(e) => e.stopPropagation()}>{part}</a>;
    }
    return part;
  });
};

const MessageBubble = ({ message, isOwn, formatTime, currentUserId, onReply, onDelete, onReact, showReadReceipt, otherUserAvatar, otherUserName, swipeOffset = 0 }: MessageBubbleProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const reelIdInContent = message.content ? (message.content.match(REEL_URL_REGEX)?.[1] ?? null) : null;

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressTimer.current);
  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setShowMenu(true); };

  const closeMenu = () => setShowMenu(false);

  const reactions = message.reactions || {};
  const hasReactions = Object.values(reactions).some((users) => users.length > 0);

  return (
    <>
      <div className="flex items-end gap-1">
        {/* Timestamp column ซ้าย — แสดงเมื่อ swipe right สำหรับ message ของเรา */}
        {isOwn && (
          <div
            className="flex-shrink-0 text-xs text-muted-foreground overflow-hidden whitespace-nowrap flex items-center justify-end"
            style={{
              width: swipeOffset > 0 ? `${Math.max(0, swipeOffset * 0.75)}px` : "0px",
              opacity: swipeOffset / 80,
              transition: swipeOffset === 0 ? "all 0.2s ease-out" : "none",
            }}
          >
            {formatTime(message.created_at)}
          </div>
        )}
      <div className={`flex items-end gap-2 flex-1 ${isOwn ? "flex-row-reverse" : ""}`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/user/${message.user_id}`)}>
            <AvatarImage src={message.user_avatar} />
            <AvatarFallback className="bg-muted text-xs">{message.user_display_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        )}

        <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{message.user_display_name}</p>}

          {/* Reply preview */}
          {!message.is_deleted && message.reply_preview && (
            <div className={`text-xs border-l-2 border-primary/60 bg-muted/60 px-2 py-1 rounded mb-1 max-w-full opacity-75 truncate ${isOwn ? "mr-1" : "ml-1"}`}>
              ↩ {message.reply_preview}
            </div>
          )}

          {/* Bubble */}
          <div
            onTouchStart={!message.is_deleted ? handleTouchStart : undefined}
            onTouchEnd={!message.is_deleted ? handleTouchEnd : undefined}
            onTouchMove={!message.is_deleted ? handleTouchEnd : undefined}
            onContextMenu={!message.is_deleted ? handleContextMenu : undefined}
            className={`px-4 py-2 rounded-2xl select-none ${isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}
          >
            {message.is_deleted ? (
              <p className="text-sm italic opacity-60">{t("common.deletedMessage")}</p>
            ) : reelIdInContent ? (
              <ReelPreviewCard reelId={reelIdInContent} isOwn={isOwn} />
            ) : (
              <>
                {message.media_type === "image" && message.media_url && (
                  <img
                    src={message.media_url}
                    alt="Shared image"
                    className="max-w-full rounded-lg mb-1 cursor-pointer active:opacity-80"
                    style={{ maxHeight: "200px" }}
                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(message.media_url!); }}
                  />
                )}
                {message.media_type === "audio" && message.media_url && <AudioPlayer src={message.media_url} />}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">{renderTextWithLinks(message.content)}</p>
                )}
              </>
            )}
          </div>

          {/* Reactions */}
          {!message.is_deleted && hasReactions && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactions).map(([emoji, users]) =>
                users.length > 0 ? (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(message.id, emoji)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      currentUserId && users.includes(currentUserId)
                        ? "bg-primary/20 border-primary/50"
                        : "bg-muted border-border hover:bg-muted/80"
                    }`}
                  >
                    {emoji} {users.length}
                  </button>
                ) : null
              )}
            </div>
          )}

          <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
            {formatTime(message.created_at)}
          </p>

          {/* Read receipt — แสดงใต้ message ล่าสุดที่ถูกอ่านแล้ว */}
          {isOwn && showReadReceipt && (
            <div className="flex items-center justify-end gap-1 mt-0.5 mr-1">
              <Avatar className="w-4 h-4">
                <AvatarImage src={otherUserAvatar || undefined} />
                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                  {otherUserName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">อ่านแล้ว</span>
            </div>
          )}
        </div>
      </div>
        {/* Timestamp column ขวา — สำหรับ message คนอื่น */}
        {!isOwn && (
          <div
            className="flex-shrink-0 text-xs text-muted-foreground overflow-hidden whitespace-nowrap flex items-center"
            style={{
              width: swipeOffset > 0 ? `${Math.max(0, swipeOffset * 0.75)}px` : "0px",
              opacity: swipeOffset / 80,
              transition: swipeOffset === 0 ? "all 0.2s ease-out" : "none",
            }}
          >
            {formatTime(message.created_at)}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xl leading-none z-10"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Action Menu (bottom sheet) */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={closeMenu}>
          <div className="w-full bg-card border-t border-border rounded-t-2xl p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            {/* Emoji row */}
            <div className="flex justify-around pb-3 border-b border-border">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReact?.(message.id, emoji); closeMenu(); }}
                  className="text-2xl p-2 hover:bg-muted rounded-xl transition-colors active:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => { onReply?.(message); closeMenu(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl text-sm transition-colors"
            >
              <Reply className="w-5 h-5 text-muted-foreground" />
              {t("common.replying")}
            </button>

            {isOwn && (
              <button
                onClick={() => { onDelete?.(message.id); closeMenu(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 rounded-xl text-sm text-destructive transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                {t("common.deleteMessage")}
              </button>
            )}

            <button onClick={closeMenu} className="w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;
