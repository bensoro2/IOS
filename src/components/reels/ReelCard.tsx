import { useRef, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Trash2, Play, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReelCommentsSheet } from "./ReelCommentsSheet";
import { ReportReelSheet } from "./ReportReelSheet";
import { ReelShareSheet } from "./ReelShareSheet";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  description: string | null;
  music_name: string | null;
  views_count: number;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isOwner: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onLike: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export const ReelCard = ({ 
  reel, 
  isActive, 
  isOwner,
  volume,
  onVolumeChange,
  onLike, 
  onDelete,
  onRefresh 
}: ReelCardProps) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        setShowShareSheet(false);
      }
    }
  }, [isActive]);

  const handleVideoClick = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < 300) {
      // Double tap — ยกเลิก single tap แล้ว like + heart animation
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      if (!reel.is_liked) onLike();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
      return;
    }

    // Single tap — รอ 300ms ก่อน ถ้าไม่มี tap 2 ค่อย play/pause
    singleTapTimer.current = setTimeout(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }, 300);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (volume > 0) {
      onVolumeChange(0);
    } else {
      onVolumeChange(100);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0]);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = volume === 0;
    }
  }, [volume]);

  const handleUserClick = () => {
    navigate(`/user/${reel.user_id}`);
  };

  const handleShare = () => setShowShareSheet(true);

  return (
    <div data-reel-item className="h-[100dvh] w-full snap-start snap-always relative bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-contain"
        loop
        muted={volume === 0}
        playsInline
        onClick={handleVideoClick}
      />

      {/* Double-tap heart animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-24 h-24 text-red-500 fill-red-500"
            style={{ animation: "heartPop 0.7s ease-out forwards" }} />
        </div>
      )}
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(0); opacity: 1; }
          50%  { transform: scale(1.3); opacity: 1; }
          80%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-10 h-10 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4">
        {/* Like */}
        <button 
          onClick={onLike}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            reel.is_liked ? 'bg-white/20' : 'bg-white/10'
          }`}>
            <Heart 
              className={`w-5 h-5 ${reel.is_liked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
            />
          </div>
          <span className="text-white text-xs font-medium">{reel.likes_count}</span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{reel.comments_count}</span>
        </button>

        {/* Share */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Report */}
        {!isOwner && (
          <button 
            onClick={() => setShowReport(true)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* Volume Control */}
        <div className="relative flex flex-col items-center">
          {showVolumeSlider && (
            <div 
              className="absolute right-12 top-1/2 -translate-y-1/2 bg-black/80 rounded-lg px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (Capacitor.isNativePlatform()) {
                toggleMute(e);
              } else {
                setShowVolumeSlider(!showVolumeSlider);
              }
            }}
            onDoubleClick={!Capacitor.isNativePlatform() ? toggleMute : undefined}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Delete Button for Owner - positioned on the right */}
      {isOwner && (
        <div className="absolute right-4 bottom-20">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("reelCard.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("reelCard.deleteDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute left-4 right-20 bottom-20">
        {/* User Info */}
        <div 
          onClick={handleUserClick}
          className="flex items-center gap-3 mb-2 cursor-pointer"
        >
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={reel.user?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {reel.user?.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold">
            {reel.user?.display_name || t("common.unknownUser")}
          </span>
        </div>

        {/* Description */}
        {reel.description && (
          <p className="text-white text-sm line-clamp-2">
            {reel.description.split(/(\s+)/).map((word, i) =>
              word.startsWith("#") && word.length > 1 ? (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); navigate(`/reels/search?q=${encodeURIComponent(word)}`); }}
                  className="text-primary font-semibold hover:underline"
                >
                  {word}
                </button>
              ) : word.startsWith("@") && word.length > 1 ? (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); navigate(`/reels/search?q=${encodeURIComponent(word)}`); }}
                  className="text-blue-300 font-semibold hover:underline"
                >
                  {word}
                </button>
              ) : (
                <span key={i}>{word}</span>
              )
            )}
          </p>
        )}

        {/* Music */}
        {reel.music_name && (
          <p className="text-white/70 text-xs mt-1">🎵 {reel.music_name}</p>
        )}
      </div>

      {/* Comments Sheet */}
      <ReelCommentsSheet
        reelId={reel.id}
        open={showComments}
        onOpenChange={setShowComments}
        onCommentAdded={onRefresh}
      />

      {/* Share Sheet — แยกออกเป็น ReelShareSheet.tsx */}
      <ReelShareSheet
        reelId={reel.id}
        description={reel.description}
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
      />

      {/* Report Sheet */}
      <ReportReelSheet
        reelId={reel.id}
        open={showReport}
        onOpenChange={setShowReport}
      />
    </div>
  );
};
