import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProvinceSelector } from "@/components/ProvinceSelector";
import { CreateActivityDialog } from "@/components/CreateActivityDialog";
import { ActivityCard } from "@/components/ActivityCard";
import { ActivitySearchSelector } from "@/components/ActivitySearchSelector";
import JoinRequestsDialog from "@/components/JoinRequestsDialog";
import { toast } from "sonner";
import {
  Bell,
  Store,
  Plus,
  Sparkles,
  Loader2,
  UserPlus
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { calculateLevel } from "@/utils/levelSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSelectedCountryCode, getDefaultProvince } from "@/constants/countryProvinces";

const Index = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const countryCode = getSelectedCountryCode();
  const savedProvince = localStorage.getItem("selected_province");
  const initialProvince = savedProvince || getDefaultProvince(countryCode);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince || getDefaultProvince(countryCode));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
   const [kickedActivityIds, setKickedActivityIds] = useState<Set<string>>(new Set());
   const [pendingRequestActivityIds, setPendingRequestActivityIds] = useState<Set<string>>(new Set());
   const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
   const [showJoinRequestsDialog, setShowJoinRequestsDialog] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
   const [authorProfiles, setAuthorProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const [authorCategoryLevels, setAuthorCategoryLevels] = useState<Record<string, number>>({});
  const navigate = useNavigate();

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

  const fetchActivities = async (province: string, category?: string) => {
    // If no province selected, don't fetch (avoids showing all countries' posts)
    if (!province) {
      setActivities([]);
      setActivitiesLoading(false);
      return;
    }
    setActivitiesLoading(true);
    try {
      let query = supabase
        .from("activities")
        .select("*")
        .eq("province", province);
      
      if (category) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);

      // Fetch author profiles for all unique user_ids
      const userIds = [...new Set((data || []).map(a => a.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const [{ data: users }, { data: actCheckins }, { data: fastCheckins }] = await Promise.all([
          supabase.from("users").select("id, display_name, avatar_url").in("id", userIds),
          supabase.from("activity_checkins").select("user_id, category").in("user_id", userIds),
          supabase.from("fast_checkins").select("user_id, category").in("user_id", userIds),
        ]);

        // Count check-ins per user+category to match Profile page logic
        const categoryCheckinCounts: Record<string, number> = {};
        [...(actCheckins || []), ...(fastCheckins || [])].forEach((c: any) => {
          if (c.category) {
            const key = `${c.user_id}:${c.category}`;
            categoryCheckinCounts[key] = (categoryCheckinCounts[key] || 0) + 1;
          }
        });

        // Convert counts to levels
        const levels: Record<string, number> = {};
        Object.entries(categoryCheckinCounts).forEach(([key, count]) => {
          levels[key] = calculateLevel(count);
        });
        setAuthorCategoryLevels(levels);

        const profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
        (users || []).forEach(u => {
          profiles[u.id] = {
            display_name: u.display_name,
            avatar_url: u.avatar_url,
          };
        });
        setAuthorProfiles(profiles);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

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

    fetchActivities(selectedProvince, selectedCategory);

    return () => subscription.unsubscribe();
  }, []);

  // Refetch activities when province or category changes
  useEffect(() => {
    fetchActivities(selectedProvince, selectedCategory);
  }, [selectedProvince, selectedCategory]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card">
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
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Search Bar */}
        <ActivitySearchSelector
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        />

        {/* Create Activity Post Button */}
        <CreateActivityDialog selectedProvince={selectedProvince} onActivityCreated={() => fetchActivities(selectedProvince, selectedCategory)} />

        {/* Nearby Activities Section */}
        <div className="space-y-3 pb-24">
         <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold text-lg">{t("home.nearbyActivities")}</h2>
            </div>

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
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        onHomeClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          fetchActivities(selectedProvince, selectedCategory);
        }}
        centerButton={
          <CreateActivityDialog 
            selectedProvince={selectedProvince}
            onActivityCreated={() => fetchActivities(selectedProvince, selectedCategory)}
            trigger={
              <button className="p-3 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Plus className="w-6 h-6" />
              </button>
            }
          />
        }
      />
 
       {/* Join Requests Dialog */}
       <JoinRequestsDialog
         open={showJoinRequestsDialog}
         onOpenChange={setShowJoinRequestsDialog}
         currentUserId={user?.id}
         onRequestHandled={() => fetchIncomingRequests(user?.id)}
       />
    </div>
  );
};

export default Index;
