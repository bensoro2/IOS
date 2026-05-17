import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Status =
  | "loading"
  | "not_logged_in"
  | "not_found"
  | "already_member"
  | "pending"
  | "kicked"
  | "idle"
  | "joining"
  | "requesting"
  | "joined"
  | "requested";

interface GroupInfo {
  title: string;
  image_url: string | null;
  member_count: number;
}

const JoinGroup = () => {
  const { groupChatId } = useParams<{ groupChatId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("loading");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [groupChatId]);

  const init = async () => {
    if (!groupChatId) { setStatus("not_found"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("not_logged_in"); return; }
    setCurrentUserId(user.id);

    const { data: chatData } = await supabase
      .from("activity_group_chats")
      .select("created_by, activities(title, image_url)")
      .eq("id", groupChatId)
      .single();

    if (!chatData) { setStatus("not_found"); return; }

    const act = chatData.activities as { title: string; image_url: string | null } | null;

    const { count } = await supabase
      .from("group_chat_members")
      .select("*", { count: "exact", head: true })
      .eq("group_chat_id", groupChatId);

    setGroupInfo({ title: act?.title || "", image_url: act?.image_url || null, member_count: count || 0 });

    // Check already a member
    const { data: memberRow } = await supabase
      .from("group_chat_members")
      .select("id")
      .eq("group_chat_id", groupChatId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow) { navigate(`/group-chat/${groupChatId}`, { replace: true }); return; }

    // Check kicked
    const { data: kickedRow } = await supabase
      .from("kicked_members")
      .select("id")
      .eq("group_chat_id", groupChatId)
      .eq("user_id", user.id)
      .maybeSingle();

    // Check pending request
    const { data: requestRow } = await supabase
      .from("join_requests")
      .select("id")
      .eq("group_chat_id", groupChatId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (requestRow) { setStatus("pending"); return; }
    if (kickedRow) { setStatus("kicked"); return; }
    setStatus("idle");
  };

  const handleJoin = async () => {
    if (!currentUserId || !groupChatId) return;
    setStatus("joining");
    try {
      const { error } = await supabase
        .from("group_chat_members")
        .insert({ group_chat_id: groupChatId, user_id: currentUserId });
      if (error) throw error;
      setStatus("joined");
      setTimeout(() => navigate(`/group-chat/${groupChatId}`), 1200);
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      setStatus("idle");
    }
  };

  const handleRequestToJoin = async () => {
    if (!currentUserId || !groupChatId) return;
    setStatus("requesting");
    try {
      const { error } = await supabase
        .from("join_requests")
        .insert({ group_chat_id: groupChatId, user_id: currentUserId, status: "pending" });
      if (error && error.code !== "23505") throw error;
      setStatus("requested");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      setStatus(status === "kicked" ? "kicked" : "idle");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground text-lg">{t("joinGroup.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />กลับหน้าหลัก</Button>
      </div>
    );
  }

  if (status === "not_logged_in") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6 text-center">
        {groupInfo && (
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-20 h-20">
              <AvatarImage src={groupInfo.image_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {groupInfo.title?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{groupInfo.title}</h1>
          </div>
        )}
        <p className="text-muted-foreground">{t("joinGroup.loginRequired")}</p>
        <Button className="w-full max-w-xs" onClick={() => navigate("/auth")}>
          {t("joinGroup.loginToJoin")}
        </Button>
      </div>
    );
  }

  const isKicked = status === "kicked" || (status === "requesting" && groupInfo !== null);

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">{t("joinGroup.title")}</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        {groupInfo && (
          <>
            <Avatar className="w-24 h-24">
              <AvatarImage src={groupInfo.image_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {groupInfo.title?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-2xl font-bold mb-1">{groupInfo.title}</h1>
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                <span>{groupInfo.member_count} {t("joinGroup.members")}</span>
              </div>
            </div>
          </>
        )}

        {(status === "kicked") && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300 max-w-xs">
            {t("joinGroup.kickedNote")}
          </div>
        )}

        {status === "joined" && (
          <p className="text-green-600 font-medium">{t("joinGroup.joinedSuccess")}</p>
        )}
        {(status === "requested" || status === "pending") && (
          <p className="text-muted-foreground">{
            status === "requested" ? t("joinGroup.requestedSuccess") : t("joinGroup.pendingRequest")
          }</p>
        )}

        <div className="w-full max-w-xs space-y-3">
          {status === "idle" && (
            <Button className="w-full" size="lg" onClick={handleJoin}>
              {t("joinGroup.join")}
            </Button>
          )}
          {status === "joining" && (
            <Button className="w-full" size="lg" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("joinGroup.join")}
            </Button>
          )}
          {status === "kicked" && (
            <Button className="w-full" size="lg" onClick={handleRequestToJoin}>
              {t("joinGroup.requestToJoin")}
            </Button>
          )}
          {status === "requesting" && (
            <Button className="w-full" size="lg" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("joinGroup.requestToJoin")}
            </Button>
          )}
          {(status === "pending" || status === "requested") && (
            <Button className="w-full" size="lg" variant="outline" disabled>
              {t("joinGroup.pendingRequest")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
