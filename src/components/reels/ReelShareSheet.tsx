import { useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { X, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReelShareSheetProps {
  reelId: string;
  description: string | null;
  open: boolean;
  onClose: () => void;
}

type Contact = { id: string; display_name: string | null; avatar_url: string | null };

export function ReelShareSheet({ reelId, description, open, onClose }: ReelShareSheetProps) {
  const { t } = useLanguage();
  const [dmContacts, setDmContacts] = useState<Contact[]>([]);
  const [loadingDm, setLoadingDm] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [shareSearch, setShareSearch] = useState("");
  const [shareSearchResults, setShareSearchResults] = useState<Contact[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  const shareUrl = `https://exjeqvboxyacmtzclnxq.supabase.co/functions/v1/reel-og?id=${reelId}`;
  const shareText = description || t("share.checkReel");

  if (open && !loadedRef.current) {
    loadedRef.current = true;
    setLoadingDm(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoadingDm(false); return; }
      supabase
        .from("direct_messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data: msgs }) => {
          if (msgs) {
            const otherIds = [...new Set(msgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))].slice(0, 10);
            if (otherIds.length > 0) {
              supabase.from("users").select("id, display_name, avatar_url").in("id", otherIds).then(({ data: users }) => {
                const sorted = otherIds.map(id => users?.find(u => u.id === id)).filter(Boolean) as Contact[];
                setDmContacts(sorted);
              });
            }
          }
          setLoadingDm(false);
        });
    });
  }

  const handleClose = () => {
    loadedRef.current = false;
    setShareSearch("");
    setShareSearchResults([]);
    onClose();
  };

  const handleNativeShare = async () => {
    if (Capacitor.isNativePlatform()) {
      try { await Share.share({ title: shareText, text: shareText, url: shareUrl, dialogTitle: t("share.shareReel") }); }
      catch { /* cancelled */ }
    } else if (navigator.share) {
      try { await navigator.share({ title: shareText, text: shareText, url: shareUrl }); }
      catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t("share.copied"));
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_system");
  };

  const handleMessenger = () => {
    window.open(`fb-messenger://share?link=${encodeURIComponent(shareUrl)}`, "_system");
  };

  const handleSearch = (val: string) => {
    setShareSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length < 1) { setShareSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase.from("users").select("id, display_name, avatar_url").ilike("display_name", `%${val.trim()}%`).neq("status", "suspended").limit(5);
      setShareSearchResults(data || []);
    }, 300);
  };

  const shareViaDm = async (contactId: string) => {
    setSendingTo(contactId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const dmUrl = `https://levelon.lovable.app/reels?startId=${reelId}`;
      await supabase.from("direct_messages").insert({ sender_id: user.id, receiver_id: contactId, content: `${shareText}\n${dmUrl}` });
      toast.success(t("share.sent"));
      handleClose();
    } catch {
      toast.error(t("share.sendError"));
    } finally {
      setSendingTo(null);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-card rounded-t-2xl p-4 pb-24 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground font-semibold text-base">{t("share.title")}</h3>
          <button onClick={handleClose} className="p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
          <button onClick={handleNativeShare} className="flex flex-col items-center gap-1.5 min-w-[60px] shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <span className="text-xs text-foreground">{t("share.share")}</span>
          </button>

          <button onClick={handleFacebook} className="flex flex-col items-center gap-1.5 min-w-[60px] shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#1877F2" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <span className="text-xs text-foreground">Facebook</span>
          </button>

          <button onClick={handleMessenger} className="flex flex-col items-center gap-1.5 min-w-[60px] shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0099FF,#A033FF,#FF5C87)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.626 0 12-4.974 12-11.111S18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z"/></svg>
            </div>
            <span className="text-xs text-foreground">Messenger</span>
          </button>
        </div>

        <div className="border-t border-border mb-3" />

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={t("share.searchUsers")} value={shareSearch} onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none border border-border focus:ring-1 focus:ring-ring" />
        </div>

        {shareSearch.trim().length > 0 && shareSearchResults.length > 0 && (
          <div className="flex flex-col gap-1 mb-3 max-h-[150px] overflow-y-auto">
            {shareSearchResults.map(user => (
              <button key={user.id} onClick={() => shareViaDm(user.id)} disabled={sendingTo === user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/80 transition-colors">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{user.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground truncate">{sendingTo === user.id ? t("share.sending") : (user.display_name || t("common.user"))}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-2">
          {loadingDm ? (
            <div className="flex items-center justify-center w-full py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            dmContacts.map(contact => (
              <button key={contact.id} onClick={() => shareViaDm(contact.id)} disabled={sendingTo === contact.id}
                className="flex flex-col items-center gap-1.5 min-w-[60px] shrink-0">
                <Avatar className="w-14 h-14 border-2 border-border">
                  <AvatarImage src={contact.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{contact.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-foreground truncate w-[60px] text-center">
                  {sendingTo === contact.id ? t("share.sending") : (contact.display_name || t("common.user"))}
                </span>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
