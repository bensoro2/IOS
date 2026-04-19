import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import { CreateReelDialog } from "@/components/reels/CreateReelDialog";
import { ReelCard } from "@/components/reels/ReelCard";
import { ReelsSearchBar } from "@/components/reels/ReelsSearchBar";
import { redirectToAuth } from "@/utils/authRedirect";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  description: string | null;
  music_name: string | null;
  views_count: number;
  created_at: string;
  category: string | null;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

const Reels = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [globalVolume, setGlobalVolume] = useState(() => {
    const saved = localStorage.getItem('reels-volume');
    return saved ? parseInt(saved, 10) : 100;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startReelId = searchParams.get("startId");
  const filterUserId = searchParams.get("userId");
  const hasScrolledToStart = useRef(false);

  const fetchReels = useCallback(async (currentUserId?: string, filterByUserId?: string | null) => {
    try {
      let query = supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false });

      // If filterByUserId is provided, only fetch reels from that user
      if (filterByUserId) {
        query = query.eq("user_id", filterByUserId);
      }

      const { data: reelsData, error } = await query;

      if (error) throw error;

      if (!reelsData || reelsData.length === 0) {
        setReels([]);
        return;
      }

      // Fetch user info for each reel
      const userIds = [...new Set(reelsData.map(r => r.user_id))];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, status")
        .in("id", userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Filter out reels from suspended users
      const activeReels = reelsData.filter(r => {
        const u = usersMap.get(r.user_id);
        return u && u.status !== "suspended";
      });

      // Fetch likes count for each reel
      const reelIds = activeReels.map(r => r.id);

      if (reelIds.length === 0) {
        setReels([]);
        return;
      }

      const { data: likesData } = await supabase
        .from("reel_likes")
        .select("reel_id")
        .in("reel_id", reelIds);

      const likesCount = new Map<string, number>();
      likesData?.forEach(like => {
        likesCount.set(like.reel_id, (likesCount.get(like.reel_id) || 0) + 1);
      });

      // Fetch comments count for each reel
      const { data: commentsData } = await supabase
        .from("reel_comments")
        .select("reel_id")
        .in("reel_id", reelIds);

      const commentsCount = new Map<string, number>();
      commentsData?.forEach(comment => {
        commentsCount.set(comment.reel_id, (commentsCount.get(comment.reel_id) || 0) + 1);
      });

      // Check if user liked each reel
      let userLikes = new Set<string>();
      if (currentUserId) {
        const { data: userLikesData } = await supabase
          .from("reel_likes")
          .select("reel_id")
          .eq("user_id", currentUserId)
          .in("reel_id", reelIds);

        userLikes = new Set(userLikesData?.map(l => l.reel_id) || []);
      }

      // Fetch user preferences for personalized feed
      let preferencesMap = new Map<string, number>();
      if (currentUserId && !filterByUserId) {
        const { data: prefs } = await supabase
          .from("user_reel_preferences")
          .select("category, score")
          .eq("user_id", currentUserId);

        if (prefs) {
          prefs.forEach(p => preferencesMap.set(p.category, p.score));
        }
      }

      const enrichedReels: Reel[] = activeReels.map(reel => ({
        ...reel,
        user: usersMap.get(reel.user_id) || null,
        likes_count: likesCount.get(reel.id) || 0,
        comments_count: commentsCount.get(reel.id) || 0,
        is_liked: userLikes.has(reel.id),
      }));

      // Sort by preference score if user has preferences and not filtering by user
      if (preferencesMap.size > 0 && !filterByUserId) {
        enrichedReels.sort((a, b) => {
          const scoreA = a.category ? (preferencesMap.get(a.category) || 0) : 0;
          const scoreB = b.category ? (preferencesMap.get(b.category) || 0) : 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          // Secondary sort by recency
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      setReels(enrichedReels);
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        fetchReels(session?.user?.id, filterUserId);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      fetchReels(session?.user?.id, filterUserId);
    });

    return () => subscription.unsubscribe();
  }, [fetchReels, filterUserId]);

  // Scroll to the starting reel when startReelId is provided
  useEffect(() => {
    if (!startReelId || reels.length === 0 || hasScrolledToStart.current) return;

    const startIndex = reels.findIndex(r => r.id === startReelId);
    if (startIndex !== -1) {
      hasScrolledToStart.current = true;
      setCurrentIndex(startIndex);

      // Wait for DOM to render, then scroll to the target
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const items = container.querySelectorAll<HTMLElement>("[data-reel-item]");
        const target = items[startIndex];
        if (target) {
          container.scrollTo({ top: target.offsetTop, behavior: "instant" });
        }
      });
    }
  }, [startReelId, reels]);

  // Increment views_count when a reel becomes active
  const viewedReelsRef = useRef(new Set<string>());
  useEffect(() => {
    if (reels.length === 0) return;
    const reel = reels[currentIndex];
    if (!reel || viewedReelsRef.current.has(reel.id)) return;
    viewedReelsRef.current.add(reel.id);

    // Update locally for instant UI feedback
    setReels(prev => prev.map((r, i) => 
      i === currentIndex ? { ...r, views_count: r.views_count + 1 } : r
    ));

    // Update in database using RPC (bypasses RLS)
    supabase.rpc("increment_reel_views", { _reel_id: reel.id }).then(() => {});
  }, [currentIndex, reels.length]);

  const handleVolumeChange = (newVolume: number) => {
    setGlobalVolume(newVolume);
    localStorage.setItem('reels-volume', newVolume.toString());
  };

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const isScrollingRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || reels.length === 0) return;

    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      const itemHeight = container.clientHeight || 1;
      const newIndex = Math.max(
        0,
        Math.min(reels.length - 1, Math.round(container.scrollTop / itemHeight))
      );
      if (newIndex !== currentIndexRef.current) {
        setCurrentIndex(newIndex);
      }
    });
  }, [reels.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (reels.length === 0 || isScrollingRef.current) return;

      const idx = currentIndexRef.current;
      let newIndex = idx;

      if (e.deltaY > 0 && idx < reels.length - 1) newIndex = idx + 1;
      else if (e.deltaY < 0 && idx > 0) newIndex = idx - 1;

      if (newIndex === idx) return;

      const items = container.querySelectorAll<HTMLElement>("[data-reel-item]");
      const target = items[newIndex];
      const top = target ? target.offsetTop : newIndex * container.clientHeight;

      isScrollingRef.current = true;
      setCurrentIndex(newIndex);
      container.scrollTo({ top, behavior: "smooth" });

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [reels.length]);

  const updatePreference = async (category: string | null, liked: boolean) => {
    if (!user || !category) return;
    try {
      const delta = liked ? 1 : -1;
      const { data: existing } = await supabase
        .from("user_reel_preferences")
        .select("id, score")
        .eq("user_id", user.id)
        .eq("category", category)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_reel_preferences")
          .update({ score: Math.max(0, existing.score + delta), updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else if (liked) {
        await supabase
          .from("user_reel_preferences")
          .insert({ user_id: user.id, category, score: 1 });
      }
    } catch (err) {
      console.warn("Failed to update preference:", err);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!user) {
      redirectToAuth(navigate);
      return;
    }

    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    try {
      if (reel.is_liked) {
        await supabase
          .from("reel_likes")
          .delete()
          .eq("reel_id", reelId)
          .eq("user_id", user.id);
        // Decrease preference for this category
        updatePreference(reel.category, false);
      } else {
        await supabase
          .from("reel_likes")
          .insert({ reel_id: reelId, user_id: user.id });
        createNotification({ userId: reel.user_id, actorId: user.id, type: "reel_like", reelId });
        // Increase preference for this category
        updatePreference(reel.category, true);
      }

      setReels(prev => prev.map(r => 
        r.id === reelId 
          ? { 
              ...r, 
              is_liked: !r.is_liked,
              likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1
            }
          : r
      ));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDelete = async (reelId: string) => {
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", reelId);

      if (error) throw error;

      setReels(prev => prev.filter(r => r.id !== reelId));
    } catch (error) {
      console.error("Error deleting reel:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Allow public viewing - don't redirect to auth

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-3">
        {filterUserId && (
          <button
            onClick={() => navigate(`/user/${filterUserId}`)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold flex-shrink-0">Reels</h1>
        <ReelsSearchBar />
      </header>

      {/* Reels Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide scroll-smooth overscroll-contain"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            isOwner={user?.id === reel.user_id}
            volume={globalVolume}
            onVolumeChange={handleVolumeChange}
            onLike={() => handleLike(reel.id)}
            onDelete={() => handleDelete(reel.id)}
            onRefresh={() => fetchReels(user?.id, filterUserId)}
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        centerButton={
          <CreateReelDialog onReelCreated={() => fetchReels(user?.id, filterUserId)}>
            <button className="p-3 -mt-2 rounded-full bg-primary text-primary-foreground shadow-lg">
              <Plus className="w-6 h-6" />
            </button>
          </CreateReelDialog>
        }
      />
    </div>
  );
};

export default Reels;
