import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, ThemeName } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Calendar,
  Users,
  Star,
  Loader2,
  UserPlus,
  UserMinus,
  MessageCircle,
  MapPin,
  MoreVertical,
  Ban,
  UserX,
  ShieldX,
  Store,
  LayoutGrid,
  Film,
  Play,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/dateLocale";
import { getSubCategoryById, getLocalizedName } from "@/constants/activityCategories";
import { getLocalizedProvince } from "@/components/ProvinceSelector";
import { getLocalizedShopCategory } from "@/constants/shopCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
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
import { ReportUserSheet } from "@/components/ReportUserSheet";
import { calculateLevelAndExp } from "@/utils/levelSystem";

interface ActivityJoined {
  category: string;
  count: number;
  exp: number;
  level: number;
  maxExp: number;
}

interface UserData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  status: string | null;
  theme: string | null;
  avatar_activity: string | null;
}

interface UserActivity {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  max_participants: string | null;
  province: string | null;
  category: string | null;
  is_private: boolean;
}

interface UserShop {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  province: string | null;
}

interface UserReel {
  id: string;
  video_url: string;
  views_count: number;
}

const UserProfile = () => {
  const { setOverrideTheme } = useTheme();
  const { userId } = useParams<{ userId: string }>();
  const { language, t } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activitiesJoined, setActivitiesJoined] = useState<ActivityJoined[]>([]);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
   const [showBlockDialog, setShowBlockDialog] = useState(false);
   const [isBlocking, setIsBlocking] = useState(false);
   const [isBlocked, setIsBlocked] = useState(false);
   const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [userShops, setUserShops] = useState<UserShop[]>([]);
  const [userReels, setUserReels] = useState<UserReel[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [kickedActivityIds, setKickedActivityIds] = useState<Set<string>>(new Set());
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromReelId = searchParams.get("fromReel");

  // Calculate level and EXP from check-in count (scaling system)

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setCurrentUserId(authUser.id);
         
        // Check blocks in parallel
        const [{ data: blockedData }, { data: blockedByMeData }] = await Promise.all([
          supabase.from("blocks").select("id").eq("blocker_id", userId).eq("blocked_id", authUser.id).maybeSingle(),
          supabase.from("blocks").select("id").eq("blocker_id", authUser.id).eq("blocked_id", userId).maybeSingle(),
        ]);
         
        if (blockedData) {
          setIsBlocked(true);
          setLoading(false);
          return;
        }
        setIsBlockedByMe(!!blockedByMeData);
      }

      // Run ALL data fetches in parallel
      const [
        userResult,
        followersResult,
        followingResult,
        followCheckResult,
        activityCheckinsResult,
        fastCheckinsResult,
        checkPlusResult,
        activitiesResult,
        memberResult,
        kickedResult,
        pendingResult,
      ] = await Promise.all([
        // User info
        supabase.from("users").select("*").eq("id", userId).maybeSingle(),
        // Follower count
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
        // Following count
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
        // Is following check
        authUser
          ? supabase.from("follows").select("id").eq("follower_id", authUser.id).eq("following_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
        // Check-ins (3 tables)
        supabase.from("activity_checkins").select("id, category, checked_in_at").eq("user_id", userId),
        supabase.from("fast_checkins").select("id, category, checked_in_at").eq("user_id", userId),
        supabase.from("check_plus_checkins").select("id, category, checked_in_at").eq("user_id", userId),
        // Activities
        supabase.from("activities").select("id, title, description, image_url, start_date, max_participants, province, category, is_private").eq("user_id", userId).order("created_at", { ascending: false }),
        // Member/kicked/pending for current user
        authUser
          ? supabase.from("group_chat_members").select("group_chat_id, activity_group_chats(activity_id)").eq("user_id", authUser.id)
          : Promise.resolve({ data: null }),
        authUser
          ? supabase.from("kicked_members").select("group_chat_id, activity_group_chats(activity_id)").eq("user_id", authUser.id)
          : Promise.resolve({ data: null }),
        authUser
          ? supabase.from("join_requests").select("group_chat_id, activity_group_chats(activity_id)").eq("user_id", authUser.id).eq("status", "pending")
          : Promise.resolve({ data: null }),
      ]);

      // Process user
      if (userResult.error) throw userResult.error;
      if (userResult.data) {
        setUserData(userResult.data);
        const validThemes: ThemeName[] = ["default", "dark-dandelion", "cloud-sky", "pink-silk"];
        const userTheme = (userResult.data as any).theme as string | null;
        if (userTheme && validThemes.includes(userTheme as ThemeName)) {
          setOverrideTheme(userTheme as ThemeName);
        }
      }

      // Process follows
      setFollowerCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
      if (authUser) setIsFollowing(!!followCheckResult.data);

      // Process check-ins
      const allCheckins = [
        ...(activityCheckinsResult.data || []),
        ...(fastCheckinsResult.data || []),
        ...(checkPlusResult.data || [])
      ];

      if (allCheckins.length > 0) {
        setTotalCheckins(allCheckins.length);
        const categoryCount: Record<string, number> = {};
        allCheckins.forEach((checkin: any) => {
          const category = checkin.category;
          if (category) categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        const activitiesWithExp: ActivityJoined[] = Object.entries(categoryCount).map(([category, count]) => {
          const { level, exp, maxExp } = calculateLevelAndExp(count);
          return { category, count, exp, level, maxExp };
        });
        activitiesWithExp.sort((a, b) => b.count - a.count);
        setActivitiesJoined(activitiesWithExp);
      }

      // Process activities
      if (activitiesResult.data) setUserActivities(activitiesResult.data);

      // Process member/kicked/pending
      if (memberResult.data) {
        const ids = new Set<string>();
        (memberResult.data as any[]).forEach((m: any) => {
          if (m.activity_group_chats?.activity_id) ids.add(m.activity_group_chats.activity_id);
        });
        setJoinedGroupIds(ids);
      }
      if (kickedResult.data) {
        const ids = new Set<string>();
        (kickedResult.data as any[]).forEach((k: any) => {
          if (k.activity_group_chats?.activity_id) ids.add(k.activity_group_chats.activity_id);
        });
        setKickedActivityIds(ids);
      }
      if (pendingResult.data) {
        const ids = new Set<string>();
        (pendingResult.data as any[]).forEach((p: any) => {
          if (p.activity_group_chats?.activity_id) ids.add(p.activity_group_chats.activity_id);
        });
        setPendingRequestIds(ids);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserShops = async (uid: string) => {
    setShopsLoading(true);
    try {
      const { data: shops } = await supabase
        .from("shops")
        .select("id, name, description, image_url, category, province")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      setUserShops(shops || []);
    } catch (error) {
      console.error("Error fetching user shops:", error);
    } finally {
      setShopsLoading(false);
    }
  };

  const fetchUserReels = async (uid: string) => {
    setReelsLoading(true);
    try {
      const { data: reels } = await supabase
        .from("reels")
        .select("id, video_url, views_count")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      setUserReels(reels || []);
    } catch (error) {
      console.error("Error fetching user reels:", error);
    } finally {
      setReelsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    if (userId) {
      fetchUserShops(userId);
      fetchUserReels(userId);
    }
    return () => {
      setOverrideTheme(null);
    };
  }, [userId]);

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

  const handleFollow = async () => {
    if (!currentUserId || !userId) {
      toast.error(t("toast.loginFirst"));
      return;
    }

    if (currentUserId === userId) {
      toast.error(t("userProfile.cannotFollowSelf"));
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success(t("userProfile.unfollowed"));
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success(t("userProfile.followed"));
        createNotification({ userId, actorId: currentUserId, type: "follow" });
      }
    } catch (error: any) {
      console.error("Follow error:", error);
      toast.error(t("common.error"));
    } finally {
      setIsFollowLoading(false);
    }
  };

   const handleSendMessage = () => {
    if (!userId || userId === currentUserId) return;
    navigate(`/direct/${userId}`);
  };

  const handleJoinActivity = async (activityId: string) => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }
    setJoiningActivityId(activityId);
    try {
      const { data: groupChat } = await supabase
        .from("activity_group_chats")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      if (!groupChat) {
        toast.error(t("userProfile.noGroupChat"));
        return;
      }

      const { data: existingMember } = await supabase
        .from("group_chat_members")
        .select("id")
        .eq("group_chat_id", groupChat.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (existingMember) {
        navigate(`/group-chat/${groupChat.id}`);
        return;
      }

      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({ group_chat_id: groupChat.id, user_id: currentUserId });

      if (memberError) throw memberError;

      setJoinedGroupIds(prev => new Set([...prev, activityId]));
      toast.success(t("userProfile.joinedSuccess"));
      navigate(`/group-chat/${groupChat.id}`);
    } catch (error) {
      console.error("Error joining activity:", error);
      toast.error(t("common.error"));
    } finally {
      setJoiningActivityId(null);
    }
  };

  const handleRequestJoin = async (activityId: string) => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }
    setJoiningActivityId(activityId);
    try {
      const { data: groupChat } = await supabase
        .from("activity_group_chats")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      if (!groupChat) {
        toast.error(t("userProfile.noGroupChat"));
        return;
      }

      const { error } = await supabase
        .from("join_requests")
        .insert({ group_chat_id: groupChat.id, user_id: currentUserId });

      if (error) throw error;

      setPendingRequestIds(prev => new Set([...prev, activityId]));
      toast.success(t("userProfile.requestSent"));
    } catch (error) {
      console.error("Error requesting join:", error);
      toast.error(t("common.error"));
    } finally {
      setJoiningActivityId(null);
    }
  };

   const handleBlockUser = async () => {
     if (!currentUserId || !userId) return;
     
     setIsBlocking(true);
     try {
       const { error } = await supabase
         .from("blocks")
         .insert({
           blocker_id: currentUserId,
           blocked_id: userId,
         });
 
       if (error) throw error;
 
       setIsBlockedByMe(true);
       toast.success(`${t("userProfile.blockedToast")} ${userData?.display_name || t("common.user")}`);
     } catch (error: any) {
       console.error("Error blocking user:", error);
       if (error.code === "23505") {
         toast.error(t("userProfile.alreadyBlocked"));
       } else {
          toast.error(t("common.error"));
       }
     } finally {
       setIsBlocking(false);
       setShowBlockDialog(false);
     }
   };
 
   const handleUnblockUser = async () => {
     if (!currentUserId || !userId) return;
     
     try {
       const { error } = await supabase
         .from("blocks")
         .delete()
         .eq("blocker_id", currentUserId)
         .eq("blocked_id", userId);
 
       if (error) throw error;
 
       setIsBlockedByMe(false);
       toast.success(`${t("userProfile.unblockedToast")} ${userData?.display_name || t("common.user")}`);
     } catch (error) {
       console.error("Error unblocking user:", error);
       toast.error(t("common.error"));
     }
   };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

   // Show blocked message if this user blocked the current user
   if (isBlocked) {
     return (
       <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
         <ShieldX className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("userProfile.blockedTitle")}</h2>
          <p className="text-muted-foreground text-center mb-4">
            {t("userProfile.blockedDesc")}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            {t("userProfile.back")}
          </Button>
       </div>
     );
   }
 
  if (!userData || userData.status === "suspended") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShieldX className="w-16 h-16 text-muted-foreground mb-4" />
         <h2 className="text-xl font-semibold mb-2">
           {userData?.status === "suspended" ? t("userProfile.suspendedTitle") : t("userProfile.notFoundTitle")}
         </h2>
         <p className="text-muted-foreground text-center mb-4">
           {userData?.status === "suspended" 
             ? t("userProfile.suspendedDesc")
             : t("userProfile.notFoundDesc")}
         </p>
         <Button onClick={() => navigate(-1)} variant="outline">
           {t("userProfile.back")}
         </Button>
      </div>
    );
  }

  const displayName = userData.display_name || t("common.user");
  const joinedDate = userData.created_at 
    ? format(new Date(userData.created_at), "MMM yyyy", { locale: getDateLocale(language) }) 
    : "";

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <button onClick={() => fromReelId ? navigate(`/reels?startId=${fromReelId}`) : (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">{t("userProfile.title")}</h1>
        </div>
       {/* More Options Menu */}
       {!isOwnProfile && (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="shrink-0">
               <MoreVertical className="w-5 h-5" />
             </Button>
           </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isBlockedByMe ? (
                <DropdownMenuItem onClick={handleUnblockUser}>
                  <Ban className="w-4 h-4 mr-2" />
                   {t("userProfile.unblockUser")}
                 </DropdownMenuItem>
               ) : (
                 <DropdownMenuItem
                   className="text-destructive focus:text-destructive"
                   onClick={() => setShowBlockDialog(true)}
                 >
                   <Ban className="w-4 h-4 mr-2" />
                  {t("userProfile.blockUser")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowReportSheet(true)}>
                <Flag className="w-4 h-4 mr-2" />
                {t("userProfile.reportUser")}
              </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
       )}
       {isOwnProfile && <div className="w-9" />}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={userData.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-bold mt-3">{displayName}</h2>
            {joinedDate && (
              <p className="text-sm text-muted-foreground">{t("userProfile.joinedAt")} {joinedDate}</p>
            )}

            {/* Pixel Avatar - hidden for future development */}

             {/* Action Buttons - Hide if own profile or blocked by me */}
             {!isOwnProfile && !isBlockedByMe && (
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={handleFollow}
                  className="gap-2"
                  variant={isFollowing ? "outline" : "default"}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isFollowing ? t("userProfile.unfollow") : t("userProfile.follow")}
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                   {t("userProfile.sendMessage")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
             <p className="text-2xl font-bold">{isBlockedByMe ? 0 : totalCheckins}</p>
            <p className="text-xs text-muted-foreground">{t("userProfile.activitiesJoined")}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
             <p className="text-2xl font-bold">{isBlockedByMe ? 0 : followerCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
             <p className="text-2xl font-bold">{isBlockedByMe ? 0 : followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Activities Joined Section */}
         {!isBlockedByMe && (
           <div className="bg-card rounded-2xl p-5">
             <div className="flex items-center gap-2 mb-4">
               <Star className="w-5 h-5 text-primary" />
               <h3 className="font-semibold">{t("userProfile.activitiesJoined")}</h3>
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
                           className="h-1.5 bg-muted"
                         />
                       </div>
                       <p className="text-xs text-muted-foreground mt-1">{activity.exp}/{activity.maxExp} EXP</p>
                    </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-4">
                 <p className="text-muted-foreground text-sm">{t("userProfile.noActivitiesJoined")}</p>
               </div>
             )}
           </div>
         )}

        {/* Tabs for Activities, Shops, Reels */}
         {!isBlockedByMe && (
          <div className="bg-card rounded-2xl p-5">
            <Tabs defaultValue="posts">
              <TabsList className="grid grid-cols-3 w-auto bg-transparent gap-1 mb-4">
                <TabsTrigger value="posts" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Calendar className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger value="shops" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <Store className="w-5 h-5" />
                </TabsTrigger>
                <TabsTrigger value="reels" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  <LayoutGrid className="w-5 h-5" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                {userActivities.length > 0 ? (
                  <div className="space-y-3">
                    {userActivities.map((activity) => {
                      const isOwner = currentUserId === userId;
                      const isJoined = joinedGroupIds.has(activity.id);
                      const isKicked = kickedActivityIds.has(activity.id);
                      const hasPending = pendingRequestIds.has(activity.id);
                      const needsRequest = isKicked || (activity.is_private && !isJoined && !isOwner);

                      return (
                        <Card key={activity.id} className="overflow-hidden">
                          <div className="flex gap-3 p-3">
                            {activity.image_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={activity.image_url}
                                  alt={activity.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="font-medium truncate">{activity.title}</h4>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                {activity.start_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(activity.start_date), "d MMM yyyy, HH:mm", { locale: getDateLocale(language) })}</span>
                                  </div>
                                )}
                                {activity.province && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{getLocalizedProvince(activity.province, language)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Join / Go to chat button */}
                          {!isOwnProfile && (
                            <div className="px-3 pb-3">
                              {isJoined ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1"
                                  onClick={() => handleJoinActivity(activity.id)}
                                >
                                  <Users className="w-4 h-4" />
                                  {t("userProfile.goToGroupChat")}
                                </Button>
                              ) : needsRequest ? (
                                hasPending ? (
                                  <Button variant="outline" size="sm" className="w-full gap-1" disabled>
                                    <Loader2 className="w-4 h-4" />
                                    {t("userProfile.pendingApproval")}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1 border-primary text-primary hover:bg-primary/10"
                                    disabled={joiningActivityId === activity.id}
                                    onClick={() => handleRequestJoin(activity.id)}
                                  >
                                    {joiningActivityId === activity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    {t("userProfile.requestJoin")}
                                  </Button>
                                )
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full gap-1"
                                  disabled={joiningActivityId === activity.id}
                                  onClick={() => handleJoinActivity(activity.id)}
                                >
                                  {joiningActivityId === activity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                  {t("userProfile.joinActivity")}
                                </Button>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">{t("userProfile.noPosts")}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shops" className="mt-0">
                {shopsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userShops.length === 0 ? (
                  <div className="text-center py-4">
                    <Store className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{t("userProfile.noShops")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userShops.map((shop) => (
                      <Card key={shop.id} className="overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {shop.image_url && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={shop.image_url}
                                alt={shop.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-medium truncate">{shop.name}</h4>
                            {shop.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{shop.description}</p>
                            )}
                            {shop.province && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {getLocalizedProvince(shop.province, language)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reels" className="mt-0">
                {reelsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userReels.length === 0 ? (
                  <div className="text-center py-4">
                    <Film className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{t("userProfile.noReels")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {userReels.map((reel) => (
                      <div 
                        key={reel.id} 
                        onClick={() => navigate(`/reels?startId=${reel.id}&userId=${userId}`)}
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
         )}
      </main>
       
       {/* Block Confirmation Dialog */}
       <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center gap-2">
               <UserX className="w-5 h-5 text-destructive" />
                {t("userProfile.blockConfirmTitle")} {userData?.display_name || t("common.user")}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("userProfile.blockConfirmDesc1")}
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t("userProfile.blockItem1")}</li>
                  <li>{t("userProfile.blockItem2")}</li>
                  <li>{t("userProfile.blockItem3")}</li>
                </ul>
                <p className="mt-3">{t("userProfile.blockNote")}</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBlocking}>{t("common.cancel")}</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleBlockUser}
               disabled={isBlocking}
               className="bg-destructive hover:bg-destructive/90"
             >
               {isBlocking ? (
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
               ) : null}
               {t("common.block")}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
        </AlertDialog>

      {userId && (
        <ReportUserSheet
          reportedUserId={userId}
          reportedUserName={userData?.display_name || t("common.user")}
          open={showReportSheet}
          onOpenChange={setShowReportSheet}
        />
      )}
    </div>
  );
};

export default UserProfile;
