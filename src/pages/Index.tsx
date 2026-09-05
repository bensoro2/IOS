import { useEffect, useState, useRef, useCallback } from "react";

const PAGE_SIZE = 6;
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { supabase } from "@/integrations/supabase/client";
import { ProvinceSelector } from "@/components/ProvinceSelector";
import { CreateActivityDialog } from "@/components/CreateActivityDialog";
import { ActivityCard } from "@/components/ActivityCard";
import { CategoryPickerDialog } from "@/components/CategoryPickerDialog";
import { UserSearchBar } from "@/components/UserSearchBar";
import JoinRequestsDialog from "@/components/JoinRequestsDialog";
import PullToRefresh from "@/components/PullToRefresh";
import { toast } from "sonner";
import {
  Bell,
  Store,
  Plus,
  Sparkles,
  Loader2,
  UserPlus,
  AlertTriangle,
  X
} from "lucide-react";
import { calculateLevel } from "@/utils/levelSystem";
import { normalizeSubCategoryId } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";
import { starCoinDataUrl } from "@/assets/starCoin";
import { levelCoinImg } from "@/assets/levelCoin";

// วันที่ตามเวลาไทย (Asia/Bangkok) รูปแบบ YYYY-MM-DD
const getBangkokDateKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

const SAFETY_WARNING_KEY = "safety_warning_dismissed_date";

const Index = () => {
  const { t } = useLanguage();
  const swipe = useSwipeNavigation({ left: "/messages" }); // Reels ปิดชั่วคราว → ไป Messages แทน
  const [showSafetyWarning, setShowSafetyWarning] = useState(
    () => localStorage.getItem(SAFETY_WARNING_KEY) !== getBangkokDateKey()
  );
  const [user, setUser] = useState<any>(null);
  const countryCode = getSelectedCountryCode();
  const savedProvince = localStorage.getItem("selected_province");
  const initialProvince = savedProvince || getDefaultProvince(countryCode);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince || getDefaultProvince(countryCode));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
   const [kickedActivityIds, setKickedActivityIds] = useState<Set<string>>(new Set());
   const [pendingRequestActivityIds, setPendingRequestActivityIds] = useState<Set<string>>(new Set());
   const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
   const [showJoinRequestsDialog, setShowJoinRequestsDialog] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
   const [authorProfiles, setAuthorProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const [authorCategoryLevels, setAuthorCategoryLevels] = useState<Record<string, number>>({});
  const [starCoins, setStarCoins] = useState<number>(0);
  const [levelCoins, setLevelCoins] = useState<number>(0);


  const navigate = useNavigate();

  useEffect(() => {
    const fetchStars = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("users")
        .select("star_coins, hope_coins")
        .eq("id", user.id)
        .maybeSingle();
      setStarCoins((data as any)?.star_coins ?? 0);
      setLevelCoins((data as any)?.hope_coins ?? 0);
    };
    fetchStars();
    window.addEventListener("star-coins-updated", fetchStars);
    const channel = supabase
      .channel("header-star-coins")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users" }, fetchStars)
      .subscribe();
    return () => {
      window.removeEventListener("star-coins-updated", fetchStars);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false) as any;
      setUnreadNotifCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel("header-notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const enrichAuthors = async (rows: any[]) => {
    const userIds = [...new Set(rows.map(a => a.user_id).filter(Boolean))] as string[];
    if (userIds.length === 0) return;
    // Only fetch users not already cached
    const missingIds = userIds.filter(id => !authorProfiles[id]);
    const [{ data: users }, { data: actCheckins }, { data: fastCheckins }] = await Promise.all([
      missingIds.length > 0
        ? supabase.from("users").select("id, display_name, avatar_url").in("id", missingIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("activity_checkins").select("user_id, category").in("user_id", userIds),
      supabase.from("fast_checkins").select("user_id, category").in("user_id", userIds),
    ]);

    const categoryCheckinCounts: Record<string, number> = {};
    [...(actCheckins || []), ...(fastCheckins || [])].forEach((c: any) => {
      if (c.category) {
        const cat = normalizeSubCategoryId(c.category);
        const key = `${c.user_id}:${cat}`;
        categoryCheckinCounts[key] = (categoryCheckinCounts[key] || 0) + 1;
      }
    });

    const levels: Record<string, number> = {};
    Object.entries(categoryCheckinCounts).forEach(([key, count]) => {
      levels[key] = calculateLevel(count);
    });
    setAuthorCategoryLevels(prev => ({ ...prev, ...levels }));

    if ((users || []).length > 0) {
      setAuthorProfiles(prev => {
        const next = { ...prev };
        (users || []).forEach((u: any) => {
          next[u.id] = { display_name: u.display_name, avatar_url: u.avatar_url };
        });
        return next;
      });
    }
  };

  const fetchActivities = async (province: string, category?: string) => {
    if (!province) {
      setActivities([]);
      setActivitiesLoading(false);
      setHasMore(false);
      hasMoreRef.current = false;
      return;
    }
    setActivitiesLoading(true);
    setHasMore(true);
    hasMoreRef.current = true;
    try {
      let query = supabase.from("activities").select("*").eq("province", province);
      if (category) query = query.eq("category", category);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      const rows = data || [];
      setActivities(rows);
      const more = rows.length === PAGE_SIZE;
      setHasMore(more);
      hasMoreRef.current = more;
      await enrichAuthors(rows);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadMoreActivities = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    if (!selectedProvince) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const from = activities.length;
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from("activities").select("*").eq("province", selectedProvince);
      if (selectedCategory) query = query.eq("category", selectedCategory);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      const rows = data || [];
      if (rows.length > 0) {
        setActivities(prev => {
          const seen = new Set(prev.map(a => a.id));
          const merged = [...prev];
          rows.forEach(r => { if (!seen.has(r.id)) merged.push(r); });
          return merged;
        });
        await enrichAuthors(rows);
      }
      const more = rows.length === PAGE_SIZE;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (e) {
      console.error("Error loading more activities:", e);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [activities.length, selectedProvince, selectedCategory]);

  const handleFeedScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= 700) {
      loadMoreActivities();
    }
  }, [loadMoreActivities]);


   const fetchIncomingRequests = async (userId: string) => {
     try {
       // Get all group chats owned by this user
       const { data: ownedGroups } = await supabase
         .from("activity_group_chats")
         .select("id")
         .eq("created_by", userId);
 
       if (ownedGroups && ownedGroups.length > 0) {
         const groupIds = ownedGroups.map(g => g.id);
         
         // Count pending requests for those groups
         const { count } = await supabase
           .from("join_requests")
           .select("*", { count: "exact", head: true })
           .in("group_chat_id", groupIds)
           .eq("status", "pending");
 
         setIncomingRequestsCount(count || 0);
       }
     } catch (error) {
       console.error("Error fetching incoming requests:", error);
     }
   };
 
   const fetchKickedAndPendingStatus = async (userId: string) => {
     try {
       // Get kicked status
       const { data: kickedData } = await supabase
         .from("kicked_members")
         .select("group_chat_id")
         .eq("user_id", userId);
 
       // Get pending requests
       const { data: pendingData } = await supabase
         .from("join_requests")
         .select("group_chat_id")
         .eq("user_id", userId)
         .eq("status", "pending");
 
       // Map group_chat_ids to activity_ids
       if (kickedData && kickedData.length > 0) {
         const groupChatIds = kickedData.map(k => k.group_chat_id);
         const { data: groupChats } = await supabase
           .from("activity_group_chats")
           .select("activity_id")
           .in("id", groupChatIds);
 
         const activityIds = new Set(groupChats?.map(g => g.activity_id) || []);
         setKickedActivityIds(activityIds);
       }
 
       if (pendingData && pendingData.length > 0) {
         const groupChatIds = pendingData.map(p => p.group_chat_id);
         const { data: groupChats } = await supabase
           .from("activity_group_chats")
           .select("activity_id")
           .in("id", groupChatIds);
 
         const activityIds = new Set(groupChats?.map(g => g.activity_id) || []);
         setPendingRequestActivityIds(activityIds);
       }
     } catch (error) {
       console.error("Error fetching kicked/pending status:", error);
     }
   };
 
   const handleRequestJoin = async (activityId: string) => {
     if (!user) {
       navigate("/auth");
       return;
     }
 
     setJoiningActivityId(activityId);
     try {
       // Get the group chat ID for this activity
       const { data: groupChat, error: groupChatError } = await supabase
         .from("activity_group_chats")
         .select("id")
         .eq("activity_id", activityId)
         .maybeSingle();
 
       if (groupChatError) throw groupChatError;
 
       if (!groupChat) {
         toast.error(t("home.groupChatNotFound"));
         return;
       }
 
       // Create join request
       const { error: requestError } = await supabase
         .from("join_requests")
         .insert({
           group_chat_id: groupChat.id,
           user_id: user.id,
         });
 
       if (requestError) {
         if (requestError.code === '23505') {
           toast.error(t("home.alreadyRequested"));
         } else {
           throw requestError;
         }
       } else {
         toast.success(t("home.requestSent"));
         setPendingRequestActivityIds(prev => new Set([...prev, activityId]));
       }
     } catch (error) {
       console.error("Error requesting to join:", error);
       toast.error(t("home.requestError"));
     } finally {
       setJoiningActivityId(null);
     }
   };
 
  const fetchJoinedGroups = async (userId: string) => {
    try {
      // Get all group chat IDs that the user has joined
      const { data: memberships, error } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", userId);

      if (error) throw error;

      // Get activity IDs from those group chats
      if (memberships && memberships.length > 0) {
        const groupChatIds = memberships.map(m => m.group_chat_id);
        const { data: groupChats, error: groupError } = await supabase
          .from("activity_group_chats")
          .select("activity_id")
          .in("id", groupChatIds);

        if (groupError) throw groupError;

        const activityIds = new Set(groupChats?.map(g => g.activity_id) || []);
        setJoinedGroupIds(activityIds);
      }
    } catch (error) {
      console.error("Error fetching joined groups:", error);
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setJoiningActivityId(activityId);
    try {
      // First, get the group chat ID for this activity
      const { data: groupChat, error: groupChatError } = await supabase
        .from("activity_group_chats")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      if (groupChatError) throw groupChatError;

      if (!groupChat) {
        toast.error(t("home.groupChatNotFoundContact"));
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("group_chat_members")
        .select("id")
        .eq("group_chat_id", groupChat.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        // Already a member, just navigate to chat
        navigate(`/group-chat/${groupChat.id}`);
        return;
      }

      // Add user to group chat members
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_chat_id: groupChat.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      // Update local state
      setJoinedGroupIds(prev => new Set([...prev, activityId]));
      
      toast.success(t("home.joinSuccess"));

      // Navigate to group chat
      navigate(`/group-chat/${groupChat.id}`);
    } catch (error) {
      console.error("Error joining activity:", error);
      toast.error(t("home.joinError"));
    } finally {
      setJoiningActivityId(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          fetchJoinedGroups(session.user.id);
           fetchKickedAndPendingStatus(session.user.id);
           fetchIncomingRequests(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchJoinedGroups(session.user.id);
           fetchKickedAndPendingStatus(session.user.id);
           fetchIncomingRequests(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refetch activities when province or category changes
  useEffect(() => {
    fetchActivities(selectedProvince, selectedCategory);
  }, [selectedProvince, selectedCategory]);

  // Infinite scroll — prefetch next page when sentinel appears
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreActivities();
      }
    }, { root: scrollContainerRef.current, rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreActivities, activities.length, hasMore]);

  // Realtime badge — อัปเดตเลขแจ้งเตือน join request แบบ real-time
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("join-requests-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, () => {
        fetchIncomingRequests(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not logged in, redirect to auth
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden" {...swipe}>
      {/* Header */}
      <header className="relative flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        {/* Star Coin badge — centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2" style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) / 2)' }}>
          <button
            onClick={() => navigate("/star-coins")}
            className="flex items-center gap-1 active:scale-95 transition-transform"
          >
            <img src={starCoinDataUrl} alt="Star Coin" className="w-5 h-5" />
            <span className="text-sm font-bold text-amber-500">{starCoins.toLocaleString()}</span>
          </button>
          <button
            onClick={() => navigate("/hope-coins")}
            className="flex items-center gap-1 active:scale-95 transition-transform"
          >
            <img src={levelCoinImg} alt="Level Coin" className="w-5 h-5" />
            <span className="text-sm font-bold text-primary">{levelCoins.toLocaleString()}</span>
          </button>
        </div>
        <ProvinceSelector
          selectedProvince={selectedProvince}
          onSelect={(p) => { setSelectedProvince(p); localStorage.setItem("selected_province", p); }}
        />
        <div className="flex items-center gap-2">
           <button
             onClick={() => setShowJoinRequestsDialog(true)}
             className="p-2 rounded-full bg-muted relative"
           >
             <UserPlus className="w-5 h-5" />
             {incomingRequestsCount > 0 && (
               <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                 {incomingRequestsCount > 9 ? "9+" : incomingRequestsCount}
               </span>
             )}
           </button>
          <button
            onClick={() => { setUnreadNotifCount(0); navigate("/notifications"); }}
            className="relative p-2 rounded-full bg-muted"
          >
            <Bell className={`w-5 h-5 ${unreadNotifCount > 0 ? "text-primary" : ""}`} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate("/shop")} className="p-2 rounded-full bg-muted">
            <Store className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <PullToRefresh
        ref={scrollContainerRef}
        onScroll={handleFeedScroll}
        onRefresh={async () => {
          if (!user?.id) return;
          await Promise.all([
            fetchActivities(selectedProvince, selectedCategory),
            fetchIncomingRequests(user.id),
            fetchJoinedGroups(user.id),
            fetchKickedAndPendingStatus(user.id),
          ]);
        }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Safety Warning */}
        {showSafetyWarning && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold">{t("home.safetyWarningTitle")}</p>
              <p className="leading-snug mt-0.5">{t("home.safetyWarningBody")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(SAFETY_WARNING_KEY, getBangkokDateKey());
                setShowSafetyWarning(false);
              }}
              aria-label={t("common.close")}
              className="shrink-0 text-amber-600 dark:text-amber-400 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Search Bar */}
        <UserSearchBar />

        {/* Create Activity Post Button */}
        <CreateActivityDialog selectedProvince={selectedProvince} onActivityCreated={() => fetchActivities(selectedProvince, selectedCategory)} />

        {/* Nearby Activities Section */}
        <div className="space-y-3 pb-24">
          <CategoryPickerDialog
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v)}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left active:opacity-70 transition-opacity"
              >
                <Sparkles className="w-5 h-5" />
                <h2 className="font-semibold text-lg">{t("home.selectActivity")}</h2>
              </button>
            }
          />



          {activitiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            /* Empty State */
            <div className="bg-card rounded-2xl p-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <CreateActivityDialog 
                selectedProvince={selectedProvince}
                onActivityCreated={() => fetchActivities(selectedProvince, selectedCategory)}
                trigger={
                  <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />
                     {t("home.createPost")}
                  </button>
                }
              />
            </div>
          ) : (
            /* Activity List */
            <div className="space-y-4">
              {activities.map((activity) => (
                 <ActivityCard
                   key={activity.id}
                   id={activity.id}
                    title={activity.title}
                    authorId={activity.user_id}
                   description={activity.description}
                   imageUrl={activity.image_url}
                   startDate={activity.start_date}
                   maxParticipants={activity.max_participants}
                   province={activity.province}
                   category={activity.category}
                   authorName={authorProfiles[activity.user_id]?.display_name}
                   authorAvatarUrl={authorProfiles[activity.user_id]?.avatar_url}
                   authorLevel={activity.user_id && activity.category ? authorCategoryLevels[`${activity.user_id}:${activity.category}`] || 1 : 1}
                   isOwner={user?.id === activity.user_id}
                  isJoined={joinedGroupIds.has(activity.id)}
                  isKicked={kickedActivityIds.has(activity.id)}
                  hasPendingRequest={pendingRequestActivityIds.has(activity.id)}
                  isPrivate={activity.is_private}
                  isJoining={joiningActivityId === activity.id}
                  onJoin={() => handleJoinActivity(activity.id)}
                  onRequestJoin={() => handleRequestJoin(activity.id)}
                  onUpdate={() => fetchActivities(selectedProvince, selectedCategory)}
                  onDelete={() => fetchActivities(selectedProvince, selectedCategory)}
                />
              ))}
              {hasMore && <div ref={sentinelRef} className="h-1" />}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

       {/* Join Requests Dialog */}
       <JoinRequestsDialog
         open={showJoinRequestsDialog}
         onOpenChange={setShowJoinRequestsDialog}
         currentUserId={user?.id}
         onRequestHandled={() => fetchIncomingRequests(user?.id)}
       />
      <BottomNav />
    </div>
  );
};

export default Index;
