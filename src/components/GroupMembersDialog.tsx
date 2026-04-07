import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
}

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupChatId: string;
  ownerId?: string | null;
  currentUserId?: string | null;
  onMemberKicked?: () => void;
}

const GroupMembersDialog = ({ 
  open, 
  onOpenChange, 
  groupChatId,
  ownerId,
  currentUserId,
  onMemberKicked
}: GroupMembersDialogProps) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  const isOwner = currentUserId === ownerId;

  useEffect(() => {
    if (open && groupChatId) {
      fetchMembers();
    }
  }, [open, groupChatId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("group_chat_members")
        .select("id, user_id, joined_at")
        .eq("group_chat_id", groupChatId);

      if (memberError) throw memberError;

      const enrichedMembers = await Promise.all(
        (memberData || []).map(async (member) => {
          const { data: userData } = await supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", member.user_id)
            .maybeSingle();

          return {
            ...member,
            display_name: userData?.display_name || t("common.user"),
            avatar_url: userData?.avatar_url || null,
          };
        })
      );

      setMembers(enrichedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickMember = async (memberId: string, userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;
    
    setKickingUserId(userId);
    try {
      const { error: kickError } = await supabase
        .from("kicked_members")
        .insert({
          group_chat_id: groupChatId,
          user_id: userId,
          kicked_by: currentUserId,
        });

      if (kickError) throw kickError;

      const { error } = await supabase
        .from("group_chat_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success(t("members.kickSuccess"));
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      onMemberKicked?.();
    } catch (error) {
      console.error("Error kicking member:", error);
      toast.error(t("members.kickError"));
    } finally {
      setKickingUserId(null);
    }
  };

  const handleMemberClick = (userId: string) => {
    onOpenChange(false);
    navigate(`/user/${userId}`);
  };

  const localeMap: Record<string, string> = {
    th: "th-TH", en: "en-US", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ru: "ru-RU",
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(localeMap[language] ?? "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("members.title")} ({members.length})</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("members.noMembers")}
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <button 
                    onClick={() => handleMemberClick(member.user_id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.display_name}
                        {member.user_id === ownerId && (
                          <span className="ml-2 text-xs text-primary">({t("members.owner")})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("members.joinedAt")} {formatJoinDate(member.joined_at)}
                      </p>
                    </div>
                  </button>
                  
                  {isOwner && member.user_id !== ownerId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={(e) => handleKickMember(member.id, member.user_id, e)}
                      disabled={kickingUserId === member.user_id}
                    >
                      {kickingUserId === member.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
