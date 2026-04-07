import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Search, X, Play, Heart, User, TrendingUp, Clock, Loader2 } from "lucide-react";
import {
  KEY_SEARCH_HISTORY,
  TRENDING_REELS_LIMIT,
  SEARCH_REELS_LIMIT,
  SEARCH_MUSIC_LIMIT,
  SEARCH_SUGGESTIONS_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SUGGESTION_BLUR_DELAY_MS,
} from "@/config/defaults";

interface ReelResult {
  id: string;
  video_url: string;
  description: string | null;
  views_count: number;
  likes_count: number;
  user: { display_name: string | null; avatar_url: string | null } | null;
}

interface UserResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

type TabType = "reels" | "users";

const HISTORY_KEY = KEY_SEARCH_HISTORY;
const getHistory = (): string[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const addToHistory = (q: string) => {
  const h = getHistory().filter((x) => x !== q).slice(0, 9);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...h]));
};
const removeFromHistory = (q: string) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((x) => x !== q)));
};
const clearHistory = () => localStorage.removeItem(HISTORY_KEY);

const ReelsSearch = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>("reels");
  const [reels, setReels] = useState<ReelResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [trending, setTrending] = useState<ReelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [suggestions, setSuggestions] = useState<{ users: UserResult[]; reels: ReelResult[] }>({ users: [], reels: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch trending on mount
  useEffect(() => {
    if (initialQuery) { searchAll(initialQuery); return; }
    setLoadingTrending(true);
    supabase
      .from("reels")
      .select("id, video_url, description, views_count, user_id")
      .order("views_count", { ascending: false })
      .limit(TRENDING_REELS_LIMIT)
      .then(async ({ data }) => {
        if (!data?.length) { setLoadingTrending(false); return; }
        const userIds = [...new Set(data.map((r) => r.user_id))];
        const reelIds = data.map((r) => r.id);
        const [{ data: usersData }, { data: likesData }] = await Promise.all([
          supabase.from("users").select("id, display_name, avatar_url").in("id", userIds),
          supabase.from("reel_likes").select("reel_id").in("reel_id", reelIds),
        ]);
        const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);
        const likesCount = new Map<string, number>();
        likesData?.forEach((l) => likesCount.set(l.reel_id, (likesCount.get(l.reel_id) || 0) + 1));
        setTrending(data.map((r) => ({
          id: r.id, video_url: r.video_url, description: r.description,
          views_count: r.views_count || 0, likes_count: likesCount.get(r.id) || 0,
          user: usersMap.get(r.user_id) ? { display_name: usersMap.get(r.user_id)!.display_name, avatar_url: usersMap.get(r.user_id)!.avatar_url } : null,
        })));
        setLoadingTrending(false);
      });
  }, []);

  const searchAll = useCallback(async (q: string) => {
    setLoading(true);
    const term = q.replace(/^[@#]/, "").trim();
    if (!term) { setLoading(false); return; }
    try {
      const [reelsRes, usersRes] = await Promise.all([
        searchReels(term),
        searchUsers(term),
      ]);
      setReels(reelsRes);
      setUsers(usersRes);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const searchReels = async (term: string): Promise<ReelResult[]> => {
    const [descRes, musicRes] = await Promise.all([
      supabase.from("reels").select("id, video_url, description, views_count, user_id").ilike("description", `%${term}%`).order("views_count", { ascending: false }).limit(SEARCH_REELS_LIMIT),
      supabase.from("reels").select("id, video_url, description, views_count, user_id").ilike("music_name", `%${term}%`).order("views_count", { ascending: false }).limit(SEARCH_MUSIC_LIMIT),
    ]);
    const seen = new Set<string>();
    const combined = [...(descRes.data || []), ...(musicRes.data || [])].filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    if (!combined.length) return [];
    const userIds = [...new Set(combined.map((r) => r.user_id))];
    const { data: usersData } = await supabase.from("users").select("id, display_name, avatar_url").in("id", userIds);
    const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);
    const reelIds = combined.map((r) => r.id);
    const { data: likesData } = await supabase.from("reel_likes").select("reel_id").in("reel_id", reelIds);
    const likesCount = new Map<string, number>();
    likesData?.forEach((l) => likesCount.set(l.reel_id, (likesCount.get(l.reel_id) || 0) + 1));
    return combined.map((r) => ({
      id: r.id, video_url: r.video_url, description: r.description,
      views_count: r.views_count || 0, likes_count: likesCount.get(r.id) || 0,
      user: usersMap.get(r.user_id) ? { display_name: usersMap.get(r.user_id)!.display_name, avatar_url: usersMap.get(r.user_id)!.avatar_url } : null,
    }));
  };

  const searchUsers = async (term: string): Promise<UserResult[]> => {
    const { data } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, bio")
      .ilike("display_name", `%${term}%`)
      .neq("status", "suspended")
      .limit(SEARCH_REELS_LIMIT);
    return data || [];
  };

  const fetchSuggestions = useCallback(async (val: string) => {
    const term = val.replace(/^[@#]/, "").trim();
    if (!term) { setSuggestions({ users: [], reels: [] }); return; }
    const [{ data: uData }, { data: rData }] = await Promise.all([
      supabase.from("users").select("id, display_name, avatar_url, bio").ilike("display_name", `%${term}%`).neq("status", "suspended").limit(SEARCH_SUGGESTIONS_LIMIT),
      supabase.from("reels").select("id, video_url, description, views_count, user_id").ilike("description", `%${term}%`).limit(SEARCH_SUGGESTIONS_LIMIT),
    ]);
    setSuggestions({ users: uData || [], reels: (rData || []).map(r => ({ ...r, likes_count: 0, user: null })) });
  }, []);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setQuery("");
      setReels([]);
      setUsers([]);
      setSuggestions({ users: [], reels: [] });
      return;
    }
    // Live search after 400ms debounce
    debounceRef.current = setTimeout(() => {
      setQuery(val.trim());
      searchAll(val.trim());
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    addToHistory(q.trim());
    setHistory(getHistory());
    setQuery(q.trim());
    setInputValue(q.trim());
    setShowSuggestions(false);
    searchAll(q.trim());
    navigate(`/reels/search?q=${encodeURIComponent(q.trim())}`, { replace: true });
  };

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    setReels([]);
    setUsers([]);
    setSuggestions({ users: [], reels: [] });
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "reels", label: `${t("reelsSearch.reelsTab")}${query ? ` (${reels.length})` : ""}` },
    { key: "users", label: `${t("reelsSearch.usersTab")}${query ? ` (${users.length})` : ""}` },
  ];

  const hasSuggestions = false; // disabled — live search replaces dropdown

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-3 py-2">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(inputValue); }} className="flex items-center gap-2">
          <button type="button" onClick={() => navigate("/reels")} className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), SUGGESTION_BLUR_DELAY_MS)}
              placeholder={t("reelsSearch.placeholder")}
              className="w-full h-9 pl-9 pr-9 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              autoFocus
            />
            {inputValue && (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && inputValue.trim() && (hasSuggestions || history.length > 0) && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
            {hasSuggestions ? (
              <>
                {suggestions.users.map((u) => (
                  <button key={u.id} onMouseDown={() => navigate(`/user/${u.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                    {u.avatar_url
                      ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-primary" /></div>
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">@{u.display_name || t("reelsSearch.unknownUser")}</p>
                      {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t("reelsSearch.usersTab")}</span>
                  </button>
                ))}
                {suggestions.reels.map((r) => (
                  <button key={r.id} onMouseDown={() => navigate(`/reels?startId=${r.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                    <div className="w-9 h-9 rounded-lg bg-black overflow-hidden flex-shrink-0">
                      <video src={r.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    </div>
                    <p className="text-sm truncate flex-1">{r.description || t("reelsSearch.untitledVideo")}</p>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t("reelsSearch.reelsTab")}</span>
                  </button>
                ))}
                <button onMouseDown={() => handleSearch(inputValue)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left border-t border-border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-primary">{t("reelsSearch.searchFor").replace("{q}", inputValue)}</p>
                </button>
              </>
            ) : (
              <button onMouseDown={() => handleSearch(inputValue)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                <Search className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-primary">{t("reelsSearch.searchFor").replace("{q}", inputValue)}</p>
              </button>
            )}
          </div>
        )}

        {/* Tabs — only when searching */}
        {query && (
          <div className="flex gap-1 mt-2">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : query ? (
          /* Search results */
          <div className="p-2">
            {activeTab === "reels" && <ReelsGrid reels={reels} navigate={navigate} />}
            {activeTab === "users" && <UsersGrid users={users} navigate={navigate} />}
          </div>
        ) : (
          /* No query: show history + trending */
          <div>
            {/* Search history */}
            {history.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{t("reelsSearch.recentSearches")}</span>
                  </div>
                  <button onClick={() => { clearHistory(); setHistory([]); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">{t("reelsSearch.clearAll")}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <div key={h} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1.5 group">
                      <button onClick={() => handleSearch(h)} className="text-sm">{h}</button>
                      <button onClick={() => { removeFromHistory(h); setHistory(getHistory()); }} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t("reelsSearch.trending")}</span>
              </div>
            </div>
            {loadingTrending ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 px-2">
                {trending.map((reel, i) => (
                  <button key={reel.id} onClick={() => navigate(`/reels?startId=${reel.id}`)}
                    className="relative bg-black overflow-hidden group"
                    style={{ aspectRatio: "9/16" }}>
                    <video src={reel.video_url} className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      muted playsInline preload="metadata"
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {i < 3 && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-0.5 text-white/90">
                        <Play className="w-2.5 h-2.5 fill-white/90" />
                        <span className="text-[9px]">{formatCount(reel.views_count)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-white/90">
                        <Heart className="w-2.5 h-2.5" />
                        <span className="text-[9px]">{formatCount(reel.likes_count)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ReelsGrid = ({ reels, navigate }: { reels: ReelResult[]; navigate: ReturnType<typeof useNavigate> }) => {
  const { t } = useLanguage();
  if (reels.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">{t("reelsSearch.noVideos")}</div>;
  return (
    <div className="grid grid-cols-2 gap-1">
      {reels.map((reel) => (
        <button key={reel.id} onClick={() => navigate(`/reels?startId=${reel.id}`)}
          className="relative bg-black rounded-xl overflow-hidden group" style={{ aspectRatio: "9/16" }}>
          <video src={reel.video_url} className="w-full h-full object-cover transition-transform group-hover:scale-105"
            muted preload="metadata" playsInline
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {reel.user?.avatar_url && (
            <img src={reel.user.avatar_url} className="absolute top-2 left-2 w-7 h-7 rounded-full border-2 border-white object-cover" />
          )}
          {reel.description && (
            <p className="absolute bottom-7 left-2 right-2 text-white text-[11px] line-clamp-2 text-left leading-tight">{reel.description}</p>
          )}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-white/80">
              <Play className="w-3 h-3 fill-white/80" />
              <span className="text-[10px]">{formatCount(reel.views_count)}</span>
            </div>
            <div className="flex items-center gap-1 text-white/80">
              <Heart className="w-3 h-3" />
              <span className="text-[10px]">{formatCount(reel.likes_count)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const UsersGrid = ({ users, navigate }: { users: UserResult[]; navigate: ReturnType<typeof useNavigate> }) => {
  const { t } = useLanguage();
  if (users.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">{t("reelsSearch.noUsers")}</div>;
  return (
    <div className="divide-y divide-border">
      {users.map((user) => (
        <button key={user.id} onClick={() => navigate(`/user/${user.id}`)}
          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left">
          {user.avatar_url
            ? <img src={user.avatar_url} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            : <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div>
          }
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">@{user.display_name || t("reelsSearch.unknownUser")}</p>
            {user.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{user.bio}</p>}
          </div>
        </button>
      ))}
    </div>
  );
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default ReelsSearch;
