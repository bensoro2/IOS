import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Crown, Medal, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateLevelAndExp } from "@/utils/levelSystem";
import { BottomNav } from "@/components/BottomNav";
// import { FundingBar } from "@/components/FundingBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface RankedUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  checkin_count: number;
  level: number;
  exp: number;
  maxExp: number;
}

interface CategoryRanking {
  category: string;
  emoji: string;
  name: string;
  users: RankedUser[];
}

const TopRank = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [allRankings, setAllRankings] = useState<CategoryRanking[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(0);
  const USERS_PER_PAGE = 20;

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const { data: checkins, error: checkinError } = await supabase
        .from("activity_checkins")
        .select("user_id, category");

      const { data: fastCheckins, error: fastError } = await supabase
        .from("fast_checkins")
        .select("user_id, category");

      const { data: checkPlusCheckins, error: checkPlusError } = await supabase
        .from("check_plus_checkins")
        .select("user_id, category");

      if (checkinError || fastError || checkPlusError) throw checkinError || fastError || checkPlusError;

      const allCheckins = [...(checkins || []), ...(fastCheckins || []), ...(checkPlusCheckins || [])];

      const categoryMap: Record<string, Record<string, number>> = {};
      for (const c of allCheckins) {
        if (!c.category) continue;
        if (!categoryMap[c.category]) categoryMap[c.category] = {};
        categoryMap[c.category][c.user_id] = (categoryMap[c.category][c.user_id] || 0) + 1;
      }

      const allUserIds = new Set<string>();
      for (const users of Object.values(categoryMap)) {
        for (const uid of Object.keys(users)) allUserIds.add(uid);
      }

      const { data: profiles } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", Array.from(allUserIds));

      const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = { display_name: p.display_name || t("topRank.unknownUser"), avatar_url: p.avatar_url };
      }

      const result: CategoryRanking[] = [];

      for (const [catId, users] of Object.entries(categoryMap)) {
        const subCat = getSubCategoryById(catId);
        const rankedUsers: RankedUser[] = Object.entries(users)
          .map(([userId, count]) => {
            const { level, exp, maxExp } = calculateLevelAndExp(count);
            const profile = profileMap[userId];
            return {
              user_id: userId,
              display_name: profile?.display_name || t("topRank.unknownUser"),
              avatar_url: profile?.avatar_url || null,
              checkin_count: count,
              level, exp, maxExp,
            };
          })
          .sort((a, b) => b.level - a.level || b.exp - a.exp)
          .slice(0, 1000);

        if (rankedUsers.length > 0) {
          result.push({
            category: catId,
            emoji: subCat?.emoji || "🎯",
            name: subCat ? getLocalizedName(subCat, language) : catId,
            users: rankedUsers,
          });
        }
      }

      result.sort((a, b) => b.users.length - a.users.length);

      setAllRankings(result);
      if (result.length > 0 && !selectedCategory) {
        setSelectedCategory(result[0].category);
        setPage(0);
      }
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeRanking = allRankings.find(r => r.category === selectedCategory);
  const totalUsers = activeRanking?.users.length || 0;
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);
  const paginatedUsers = activeRanking?.users.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE) || [];

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border-yellow-500/30";
    if (index === 1) return "bg-gray-300/10 border-gray-400/30";
    if (index === 2) return "bg-amber-600/10 border-amber-600/30";
    return "bg-card border-border";
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">Top Rank</h1>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="p-2">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 flex flex-col">
            <SheetHeader>
              <SheetTitle>{t("topRank.selectCategory")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1 overflow-y-auto flex-1 pb-4">
              {allRankings.map((r) => (
                <button
                  key={r.category}
                  onClick={() => {
                    setSelectedCategory(r.category);
                    setPage(0);
                    setSheetOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedCategory === r.category
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span className="flex-1 text-left text-sm font-medium">{r.name}</span>
                  {selectedCategory === r.category && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* <FundingBar /> */}

      <main className="flex-1 overflow-y-auto pb-20 min-h-0">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !activeRanking ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mb-3 opacity-40" />
            <p>{t("topRank.noData")}</p>
          </div>
        ) : (
          <div className="p-4 pt-2 space-y-3">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">{activeRanking.name}</h2>
              <p className="text-xs text-muted-foreground">{totalUsers} {t("topRank.participants")}</p>
            </div>

            {paginatedUsers.map((user, i) => {
              const globalIndex = page * USERS_PER_PAGE + i;
              return (
                <button
                  key={user.user_id}
                  onClick={() => navigate(`/user/${user.user_id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors hover:opacity-80 ${getRankBg(globalIndex)}`}
                >
                  <div className="flex-shrink-0">{getRankIcon(globalIndex)}</div>
                  <Avatar className={`w-10 h-10 ${globalIndex === 0 ? "ring-2 ring-yellow-500" : ""}`}>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">{user.checkin_count} {t("topRank.checkins")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">Lv.{user.level}</p>
                    <p className="text-xs text-muted-foreground">{user.exp}/{user.maxExp}</p>
                  </div>
                </button>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2 pb-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-full border border-border disabled:opacity-30 active:opacity-70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-full border border-border disabled:opacity-30 active:opacity-70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default TopRank;
