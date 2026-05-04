import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVITY_CATEGORIES,
  ActivityCategory,
  ActivitySubCategory,
} from "@/constants/activityCategories";

// ─── DB row type ──────────────────────────────────────────────────────────────

interface DbActivityCategory {
  id: string;
  key: string;
  label_th: string;
  label_en: string | null;
  label_ja: string | null;
  label_zh: string | null;
  label_ko: string | null;
  label_ru: string | null;
  emoji: string | null;
  icon: string | null;
  parent_key: string | null;
  sort_order: number;
  created_at: string;
}

// ─── Transform DB rows → ActivityCategory[] ───────────────────────────────────

function transformRows(rows: DbActivityCategory[]): ActivityCategory[] {
  const parents = rows
    .filter((r) => r.parent_key === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return parents.map((parent) => {
    const subRows = rows
      .filter((r) => r.parent_key === parent.key)
      .sort((a, b) => a.sort_order - b.sort_order);

    const subCategories: ActivitySubCategory[] = subRows.map((sub) => ({
      id: sub.key,
      name: sub.label_th,
      names: {
        th: sub.label_th,
        en: sub.label_en ?? sub.label_th,
        ja: sub.label_ja ?? sub.label_en ?? sub.label_th,
        zh: sub.label_zh ?? sub.label_en ?? sub.label_th,
        ko: sub.label_ko ?? sub.label_en ?? sub.label_th,
        ru: sub.label_ru ?? sub.label_en ?? sub.label_th,
      },
      emoji: sub.emoji ?? sub.icon ?? "",
    }));

    const cat: ActivityCategory = {
      id: parent.key,
      name: parent.label_th,
      names: {
        th: parent.label_th,
        en: parent.label_en ?? parent.label_th,
        ja: parent.label_ja ?? parent.label_en ?? parent.label_th,
        zh: parent.label_zh ?? parent.label_en ?? parent.label_th,
        ko: parent.label_ko ?? parent.label_en ?? parent.label_th,
        ru: parent.label_ru ?? parent.label_en ?? parent.label_th,
      },
      emoji: parent.emoji ?? parent.icon ?? "",
      subCategories,
    };

    return cat;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches activity categories from Supabase and transforms them into the same
 * shape as the hardcoded ACTIVITY_CATEGORIES constant.
 *
 * Falls back to the hardcoded data while loading or on error so the UI never
 * shows an empty list.
 */
export function useActivityCategories() {
  const query = useQuery({
    queryKey: ["activity-categories-app"],
    queryFn: async (): Promise<ActivityCategory[]> => {
      const { data, error } = await supabase
        .from("activity_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as DbActivityCategory[];

      // If the DB has no data yet (fresh deploy before seed), fall back to hardcoded
      if (rows.length === 0) return ACTIVITY_CATEGORIES;

      return transformRows(rows);
    },
    // Keep stale for 5 minutes — categories rarely change
    staleTime: 5 * 60 * 1000,
    // Use hardcoded data as placeholder while fetching
    placeholderData: ACTIVITY_CATEGORIES,
  });

  return {
    categories: query.data ?? ACTIVITY_CATEGORIES,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
