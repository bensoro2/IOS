import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const getDisplayName = (user: User) =>
  (user.user_metadata as any)?.display_name ||
  (user.user_metadata as any)?.full_name ||
  user.email?.split("@")[0] ||
  "User";

const getAvatarUrl = (user: User) => (user.user_metadata as any)?.avatar_url || null;

export const syncUserRow = async (user: User) => {
  // Upsert the current user's public profile row.
  // RLS allows only auth.uid() = id, so this is safe client-side.
  const payload = {
    id: user.id,
    email: user.email ?? null,
    display_name: getDisplayName(user),
    avatar_url: getAvatarUrl(user),
    last_login: new Date().toISOString(),
  };

  const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

/**
 * Ensures the logged-in user always has a row in public.users.
 * This enables other users to view their public profile.
 */
export const useSyncUserRow = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => {
          syncUserRow(session.user).catch(() => {
            // Intentionally silent: profile sync failure shouldn't block the app
          });
        }, 0);
      }
    });

    // Initial sync for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserRow(session.user).catch(() => {
          // silent
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);
};
