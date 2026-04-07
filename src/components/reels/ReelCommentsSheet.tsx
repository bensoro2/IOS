import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Trash2, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDateLocale } from "@/lib/dateLocale";

interface Comment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

interface ReelCommentsSheetProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded: () => void;
}

export const ReelCommentsSheet = ({
  reelId,
  open,
  onOpenChange,
  onCommentAdded,
}: ReelCommentsSheetProps) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from("reel_comments")
        .select("*")
        .eq("reel_id", reelId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      const commentIds = commentsData.map(c => c.id);
      const { data: likesData } = await supabase
        .from("reel_comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      const likesCount = new Map<string, number>();
      likesData?.forEach(l => {
        likesCount.set(l.comment_id, (likesCount.get(l.comment_id) || 0) + 1);
      });

      let userLikes = new Set<string>();
      if (currentUserId) {
        const { data: userLikesData } = await supabase
          .from("reel_comment_likes")
          .select("comment_id")
          .eq("user_id", currentUserId)
          .in("comment_id", commentIds);
        userLikes = new Set(userLikesData?.map(l => l.comment_id) || []);
      }

      const allComments: Comment[] = commentsData.map(comment => ({
        ...comment,
        user: usersMap.get(comment.user_id) || undefined,
        likes_count: likesCount.get(comment.id) || 0,
        is_liked: userLikes.has(comment.id),
      }));

      const topLevel = allComments.filter(c => !c.parent_id);
      const repliesMap = new Map<string, Comment[]>();
      allComments.filter(c => c.parent_id).forEach(c => {
        const arr = repliesMap.get(c.parent_id!) || [];
        arr.push(c);
        repliesMap.set(c.parent_id!, arr);
      });
      topLevel.forEach(c => {
        c.replies = repliesMap.get(c.id) || [];
      });

      setComments(topLevel);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchComments();
      setReplyTo(null);
    }
  }, [open, reelId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("toast.loginFirst"));
        return;
      }

      const insertData: any = {
        reel_id: reelId,
        user_id: user.id,
        content: newComment.trim(),
      };
      if (replyTo) {
        insertData.parent_id = replyTo.id;
      }

      const { error } = await supabase
        .from("reel_comments")
        .insert(insertData);

      if (error) throw error;

      const { data: reelData } = await supabase
        .from("reels")
        .select("user_id")
        .eq("id", reelId)
        .single();
      if (reelData) {
        createNotification({ userId: reelData.user_id, actorId: user.id, type: "reel_comment", reelId });
      }

      setNewComment("");
      setReplyTo(null);
      fetchComments();
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(t("comments.errorSend"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("reel_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      fetchComments();
      onCommentAdded();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(t("comments.errorDelete"));
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!currentUserId) {
      toast.error(t("toast.loginFirst"));
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("reel_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("reel_comment_likes")
          .insert({ comment_id: commentId, user_id: currentUserId });
      }

      const updateComments = (list: Comment[]): Comment[] =>
        list.map(c => {
          const updated = { ...c };
          if (c.id === commentId) {
            updated.is_liked = !isLiked;
            updated.likes_count = isLiked ? c.likes_count - 1 : c.likes_count + 1;
          }
          if (c.replies) {
            updated.replies = updateComments(c.replies);
          }
          return updated;
        });

      setComments(prev => updateComments(prev));
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 group ${isReply ? "ml-10" : ""}`}>
      <Avatar
        className="w-8 h-8 shrink-0 cursor-pointer"
        onClick={() => { onOpenChange(false); navigate(`/user/${comment.user_id}?fromReel=${reelId}`); }}
      >
        <AvatarImage src={comment.user?.avatar_url || ""} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {comment.user?.display_name?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold text-sm cursor-pointer hover:underline"
            onClick={() => { onOpenChange(false); navigate(`/user/${comment.user_id}?fromReel=${reelId}`); }}
          >
            {comment.user?.display_name || t("messages.user")}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: getDateLocale(language),
            })}
          </span>
          {currentUserId === comment.user_id && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm">{comment.content}</p>
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => handleLikeComment(comment.id, comment.is_liked)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Heart
              className={`w-3.5 h-3.5 ${comment.is_liked ? "fill-red-500 text-red-500" : ""}`}
            />
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() =>
                setReplyTo({
                  id: comment.id,
                  name: comment.user?.display_name || t("messages.user"),
                })
              }
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("comments.reply")}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="border-b pb-3">
          <SheetTitle>{t("comments.title")} ({totalCount})</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100%-120px)] py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>{t("comments.noComments")}</p>
              <p className="text-sm">{t("comments.beFirst")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-3 mt-3">
                      {comment.replies.map((reply) => renderComment(reply, true))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span>{t("comments.replyTo")} {replyTo.name}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-primary hover:underline"
              >
                {t("comments.cancel")}
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `${t("comments.replyTo")} ${replyTo.name}...` : t("comments.placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              size="icon"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
