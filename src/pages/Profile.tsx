import { useEffect, useState } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CreateReelDialog } from "@/components/reels/CreateReelDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLocalizedProvince } from "@/components/ProvinceSelector";
import { getLocalizedShopCategory } from "@/constants/shopCategories";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Settings,
  Plus,
  Calendar,
  Users,
  Star,
  MapPin,
  MoreVertical,
  Loader2,
  Zap,
  Store,
  Play,
  Film,
  LayoutGrid,
  Trophy,
  ClipboardCheck,
  MessageCircle,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/dateLocale";
import { getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreateActivityDialog } from "@/components/CreateActivityDialog";
import { EditActivityDialog } from "@/components/EditActivityDialog";
import { FastCheckInDialog } from "@/components/FastCheckInDialog";
import { CheckPlusDialog } from "@/components/CheckPlusDialog";
import { CreateShopDialog } from "@/components/CreateShopDialog";
import { EditShopDialog } from "@/components/EditShopDialog";
import { getShopCategoryById } from "@/constants/shopCategories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { calculateLevelAndExp } from "@/utils/levelSystem";

interface ActivityJoined {
  category: string;
  count: number;
  exp: number;
  level: number;
  maxExp: number;
}

interface UserActivity {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  province: string | null;
  category: string | null;
  max_participants: string | null;
  currentParticipants?: number;
}

interface UserShop {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  province: string | null;
  category: string | null;
}

interface UserReel {
  id: string;
  video_url: string;
  description: string | null;
  views_count: number;
  created_at: string;
}

interface LikedReel {
  id: string;
  video_url: string;
  description: string | null;
  views_count: number;
  created_at: string;
  user_id: string;
}

const Profile = () => {
  const swipe = useSwipeNavigation({ right: "/messages" }); // swipe right → Messages
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userShops, setUserShops] = useState<UserShop[]>([]);
  const [userReels, setUserReels] = useState<UserReel[]>([]);
  const [likedReels, setLikedReels] = useState<LikedReel[]>([]);
  const [likedReelsLoading, setLikedReelsLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [activitiesJoined, setActivitiesJoined] = useState<ActivityJoined[]>([]);
  const [totalActivitiesJoined, setTotalActivitiesJoined] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [userBio, setUserBio] = useState<string | null>(null);
  const [dbDisplayName, setDbDisplayName] = useState<string | null>(null);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);
  const [avatarActivity, setAvatarActivity] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const navigate = useNavigate();

  const [totalCheckins, setTotalCheckins] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editingShop, setEditingShop] = useState<UserShop | null>(null);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);

  const fetchFollowCounts = async (userId: string) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  // Calculate level and EXP from check-in count (scaling system)

  const fetchUserActivities = async (userId: string) => {
    setActivitiesLoading(true);
    try {
      // Fetch activities created by user
      const { data: myActivities, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserActivities(myActivities || []);

      // Fetch check-ins by user to calculate EXP - read category directly from check-ins
      const { data: activityCheckins, error: checkinError } = await supabase
        .from("activity_checkins")
        .select(`
          id,
          category,
          checked_in_at
        `)
        .eq("user_id", userId);

      if (checkinError) throw checkinError;

      // Fetch fast check-ins by user
      const { data: fastCheckins, error: fastError } = await supabase
        .from("fast_checkins")
        .select(`
          id,
          category,
          checked_in_at
        `)
        .eq("user_id", userId);

      if (fastError) throw fastError;

      // Fetch check_plus check-ins by user
      const { data: checkPlusCheckins, error: checkPlusError } = await supabase
        .from("check_plus_checkins")
        .select(`
          id,
          category,
          checked_in_at
        `)
        .eq("user_id", userId);

      if (checkPlusError) throw checkPlusError;

      // Combine all types of check-ins
      const allCheckins = [
        ...(activityCheckins || []),
        ...(fastCheckins || []),
        ...(checkPlusCheckins || [])
      ];

      if (allCheckins.length > 0) {
        setTotalCheckins(allCheckins.length);

        // Group by category and count check-ins - use category directly from check-in record
        const categoryCount: Record<string, number> = {};
        allCheckins.forEach((checkin: any) => {
          const category = checkin.category;
          if (category) {
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          }
        });

        const activitiesWithExp: ActivityJoined[] = Object.entries(categoryCount).map(([category, count]) => {
          const { level, exp, maxExp } = calculateLevelAndExp(count);
          return { category, count, exp, level, maxExp };
        });

        // Sort by count descending
        activitiesWithExp.sort((a, b) => b.count - a.count);

        setActivitiesJoined(activitiesWithExp);
        setTotalActivitiesJoined(allCheckins.length);
      } else {
        setTotalCheckins(0);
        setActivitiesJoined([]);
        setTotalActivitiesJoined(0);
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchUserShops = async (userId: string) => {
    setShopsLoading(true);
    try {
      const { data: shops, error } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserShops(shops || []);
    } catch (error) {
      console.error("Error fetching user shops:", error);
    } finally {
      setShopsLoading(false);
    }
  };

  const fetchUserReels = async (userId: string) => {
    setReelsLoading(true);
    try {
      const { data: reels, error } = await supabase
        .from("reels")
        .select("id, video_url, description, views_count, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUserReels(reels || []);
    } catch (error) {
      console.error("Error fetching user reels:", error);
    } finally {
      setReelsLoading(false);
    }
  };

  const fetchLikedReels = async (userId: string) => {
    setLikedReelsLoading(true);
    try {
      const { data: likes, error } = await supabase
        .from("reel_likes")
        .select("reel_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (likes && likes.length > 0) {
        const reelIds = likes.map(l => l.reel_id);
        const { data: reels, error: reelsError } = await supabase
          .from("reels")
          .select("id, video_url, description, views_count, created_at, user_id")
          .in("id", reelIds);
        if (reelsError) throw reelsError;
        const sortedReels = reelIds
          .map(id => reels?.find(r => r.id === id))
          .filter(Boolean) as LikedReel[];
        setLikedReels(sortedReels);
      } else {
        setLikedReels([]);
      }
    } catch (error) {
      console.error("Error fetching liked reels:", error);
    } finally {
      setLikedReelsLoading(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!deletingShopId) return;
    
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", deletingShopId);

      if (error) throw error;

      toast.success(t("profile.deleteShopSuccess"));
      if (user) fetchUserShops(user.id);
    } catch (error: any) {
      toast.error(t("common.error"));
    } finally {
      setDeletingShopId(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          fetchUserActivities(session.user.id);
          fetchUserShops(session.user.id);
          fetchUserReels(session.user.id);
          fetchLikedReels(session.user.id);
          fetchFollowCounts(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchUserActivities(session.user.id);
        fetchUserShops(session.user.id);
        fetchUserReels(session.user.id);
        fetchLikedReels(session.user.id);
        fetchFollowCounts(session.user.id);
        supabase.from("users").select("bio, display_name, avatar_url, avatar_activity, user_code").eq("id", session.user.id).maybeSingle().then(({ data }) => {
          setUserBio(data?.bio || null);
          setDbDisplayName(data?.display_name || null);
          setDbAvatarUrl(data?.avatar_url || null);
          setAvatarActivity((data as any)?.avatar_activity || null);
          setProfileLoaded(true);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch data when navigating back to profile (e.g., after check-in from GroupChat)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchUserActivities(user.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  // Re-fetch when route is visited (component remount or focus)
  useEffect(() => {
    if (user) {
      fetchUserActivities(user.id);
      fetchFollowCounts(user.id);
      supabase.from("users").select("bio, display_name, avatar_url, avatar_activity, user_code").eq("id", user.id).maybeSingle().then(({ data }) => {
        setUserBio(data?.bio || null);
        setDbDisplayName(data?.display_name || null);
        setDbAvatarUrl(data?.avatar_url || null);
        setAvatarActivity((data as any)?.avatar_activity || null);
        setProfileLoaded(true);
      });
    }
  }, [user]);

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

  if (!user) {
    navigate("/auth");
    return null;
  }

  const displayName = dbDisplayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = dbAvatarUrl || user.user_metadata?.avatar_url;

  // Get color based on category for progress bar
  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-violet-500",
      "bg-cyan-500",
    ];
    return colors[index % colors.length];
  };

  const getCategoryTextColor = (index: number) => {
    const colors = [
      "text-emerald-500",
      "text-rose-500",
      "text-amber-500",
      "text-violet-500",
      "text-cyan-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} {...swipe}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate("/")} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">{t("profile.title")}</h1>
        </div>
        <button onClick={() => navigate("/settings")} className="p-2">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 px-4 py-4 space-y-4 overflow-y-auto pb-20">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-5">
          <div className="flex items-center gap-4">
            {!profileLoaded ? (
              <>
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  {userBio && <p className="text-sm text-muted-foreground mt-1">{userBio}</p>}
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/top-rank")}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Trophy className="w-5 h-5 text-primary" />
              </button>
              <FastCheckInDialog
                onCheckInComplete={() => user && fetchUserActivities(user.id)}
                trigger={
                  <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                    <Zap className="w-5 h-5 text-primary" />
                  </button>
                }
              />
            </div>
          </div>

          {/* Pixel Avatar - hidden for future development */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold">{totalCheckins}</p>
            <p className="text-xs text-muted-foreground">{t("profile.checkins")}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold">{followersCount}</p>
            <p className="text-xs text-muted-foreground">{t("profile.followers")}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold">{followingCount}</p>
            <p className="text-xs text-muted-foreground">{t("profile.following")}</p>
          </div>
        </div>

        {/* Activities Joined Section */}
        <div className="bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t("profile.activitiesJoined")}</h3>
            </div>
            <CheckPlusDialog
              onCheckInComplete={() => user && fetchUserActivities(user.id)}
              trigger={
                <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-primary" strokeWidth={3} />
                </button>
              }
            />
          </div>
          
          {activitiesJoined.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {activitiesJoined.slice(0, 3).map((activity, index) => {
                const subCat = getSubCategoryById(activity.category);
                return (
                  <div key={activity.category} className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-xl ${getCategoryColor(index)} bg-opacity-20 flex items-center justify-center mb-2`}>
                      <span className="text-2xl">{subCat?.emoji || "🎯"}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{subCat ? getLocalizedName(subCat, language) : activity.category}</p>
                    <p className={`text-sm font-bold ${getCategoryTextColor(index)}`}>Lv.{activity.level}</p>
                    <div className="mt-2">
                      <Progress 
                        value={(activity.exp / activity.maxExp) * 100} 
                        className={`h-1.5 bg-muted`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.exp}/{activity.maxExp} EXP</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">{t("profile.noActivitiesJoined")}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("profile.joinActivitiesForExp")}</p>
            </div>
          )}
        </div>

        {/* Tabs Section */}
        <div className="bg-card rounded-2xl p-4">
          <Tabs defaultValue="my-posts" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-4 w-auto bg-transparent gap-1">
                <TabsTrigger value="my-posts" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Plus className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger value="my-shops" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Store className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger value="reels" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <LayoutGrid className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger value="liked-reels" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Heart className="w-5 h-5" />
                </TabsTrigger>
              </TabsList>
              
              <CreateActivityDialog 
                selectedProvince=""
                onActivityCreated={() => user && fetchUserActivities(user.id)}
                trigger={
                  <Button size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                     {t("profile.createPost")}
                  </Button>
                }
              />
            </div>

            <TabsContent value="my-posts" className="mt-0">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : userActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("profile.noPosts")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userActivities.map((activity) => {
                    const subCat = getSubCategoryById(activity.category || "");
                    const formattedDate = activity.start_date
                      ? format(new Date(activity.start_date), "d MMM yyyy, HH:mm", { locale: getDateLocale(language) })
                      : null;
                    
                    const handleGoToChat = async () => {
                      const { data: groupChat } = await supabase
                        .from("activity_group_chats")
                        .select("id")
                        .eq("activity_id", activity.id)
                        .maybeSingle();
                      if (groupChat) {
                        navigate(`/group-chat/${groupChat.id}`);
                      }
                    };

                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                        {activity.image_url ? (
                          <img 
                            src={activity.image_url} 
                            alt={activity.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-2xl">{subCat?.emoji || "🎯"}</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                          )}
                          <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                            {formattedDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formattedDate}
                              </span>
                            )}
                            {activity.province && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {getLocalizedProvince(activity.province, language)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            {activity.max_participants && (
                              <span className="text-xs text-primary font-medium">
                                {activity.currentParticipants || 0} {t("common.people")}
                              </span>
                            )}
                            <EditActivityDialog
                              activityId={activity.id}
                              initialData={{
                                title: activity.title,
                                description: activity.description,
                                startDate: activity.start_date,
                                maxParticipants: activity.max_participants,
                                province: activity.province,
                                imageUrl: activity.image_url,
                                category: activity.category,
                              }}
                              onActivityUpdated={() => user && fetchUserActivities(user.id)}
                              onActivityDeleted={() => user && fetchUserActivities(user.id)}
                              trigger={
                                <button className="p-1">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                              }
                            />
                          </div>
                          <button
                            onClick={handleGoToChat}
                            className="flex items-center gap-1 text-[10px] text-primary font-medium px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {t("profile.groupChat")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-shops" className="mt-0">
              {shopsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : userShops.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("profile.noShops")}</p>
                  <CreateShopDialog
                    selectedProvince=""
                    onShopCreated={() => user && fetchUserShops(user.id)}
                    trigger={
                      <Button size="sm" className="gap-1 mt-3">
                        <Plus className="w-4 h-4" />
                        {t("profile.createShop")}
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {userShops.map((shop) => {
                    const shopCat = getShopCategoryById(shop.category || "");
                    
                    return (
                      <div key={shop.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                        {shop.image_url ? (
                          <img 
                            src={shop.image_url} 
                            alt={shop.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-2xl">{shopCat?.emoji || "🏪"}</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{shop.name}</h4>
                          {shop.category && (
                            <p className="text-sm text-primary flex items-center gap-1">
                              <span>{shopCat?.emoji}</span>
                              {shopCat ? getLocalizedShopCategory(shopCat.name, language) : shop.category}
                            </p>
                          )}
                          {shop.description && (
                            <p className="text-sm text-muted-foreground truncate">{shop.description}</p>
                          )}
                          {shop.province && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              {getLocalizedProvince(shop.province, language)}
                            </span>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingShop(shop)}>
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingShopId(shop.id)}
                              className="text-destructive"
                            >
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reels" className="mt-0">
              {reelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : userReels.length === 0 ? (
                <div className="text-center py-8">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">{t("profile.noReels")}</p>
                  <CreateReelDialog onReelCreated={() => user && fetchUserReels(user.id)}>
                    <Button size="sm" className="gap-1 mt-3">
                      <Plus className="w-4 h-4" />
                      {t("profile.createReel")}
                    </Button>
                  </CreateReelDialog>
                </div>
              ) : (
              <div className="grid grid-cols-3 gap-1">
                  {userReels.map((reel) => (
                    <div 
                      key={reel.id} 
                      onClick={() => navigate(`/reels?startId=${reel.id}&userId=${user.id}`)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black cursor-pointer group"
                    >
                      <video
                        src={reel.video_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      {/* Overlay with play icon and views */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-80" />
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                        <Play className="w-3 h-3 fill-white" />
                        <span>{reel.views_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked-reels" className="mt-0">
              {likedReelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : likedReels.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">{t("profile.noLikedReels")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {likedReels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => navigate(`/reels?startId=${reel.id}&userId=${reel.user_id}`)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black cursor-pointer group"
                    >
                      <video
                        src={reel.video_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-80" />
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                        <Play className="w-3 h-3 fill-white" />
                        <span>{reel.views_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

      </main>

      {/* Edit Shop Dialog */}
      {editingShop && (
        <EditShopDialog
          open={!!editingShop}
          onOpenChange={(open) => !open && setEditingShop(null)}
          shop={{
            id: editingShop.id,
            name: editingShop.name,
            description: editingShop.description,
            imageUrl: editingShop.image_url,
            category: editingShop.category,
            province: editingShop.province,
          }}
          onUpdate={() => user && fetchUserShops(user.id)}
        />
      )}

      {/* Delete Shop Confirmation */}
      <AlertDialog open={!!deletingShopId} onOpenChange={(open) => !open && setDeletingShopId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.confirmDeleteShop")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.confirmDeleteShopDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav
        centerButton={
          <CreateActivityDialog
            selectedProvince=""
            onActivityCreated={() => {}}
            trigger={
              <button className="p-3 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Plus className="w-6 h-6" />
              </button>
            }
          />
        }
      />
    </div>
  );
};

export default Profile;
