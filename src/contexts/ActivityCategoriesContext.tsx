import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  ActivityCategory,
  ActivitySubCategory,
} from "@/constants/activityCategories";
import { useActivityCategories } from "@/hooks/useActivityCategories";

// ─── Context shape ────────────────────────────────────────────────────────────

interface ActivityCategoriesContextValue {
  /** Full list of parent categories, each with their subCategories array. */
  categories: ActivityCategory[];
  /** Whether the DB fetch is still in flight (hardcoded data is used meanwhile). */
  isLoading: boolean;
  /** Flattened list of every sub-category across all parents. */
  getAllSubCategories: () => ActivitySubCategory[];
  /** Look up a sub-category by its id (key). */
  getSubCategoryById: (id: string) => ActivitySubCategory | undefined;
  /** Look up a parent category by its id (key). */
  getCategoryById: (id: string) => ActivityCategory | undefined;
  /** Look up the parent category that owns a given sub-category. */
  getCategoryBySubCategoryId: (subId: string) => ActivityCategory | undefined;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ActivityCategoriesContext = createContext<ActivityCategoriesContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ActivityCategoriesProvider = ({ children }: { children: ReactNode }) => {
  const { categories, isLoading } = useActivityCategories();

  // Memoised helpers so referential equality is stable for consumers
  const value = useMemo<ActivityCategoriesContextValue>(() => {
    const getAllSubCategories = (): ActivitySubCategory[] =>
      categories.flatMap((cat) => cat.subCategories);

    const getSubCategoryById = (id: string): ActivitySubCategory | undefined =>
      getAllSubCategories().find((sub) => sub.id === id);

    const getCategoryById = (id: string): ActivityCategory | undefined =>
      categories.find((cat) => cat.id === id);

    const getCategoryBySubCategoryId = (subId: string): ActivityCategory | undefined =>
      categories.find((cat) => cat.subCategories.some((sub) => sub.id === subId));

    return {
      categories,
      isLoading,
      getAllSubCategories,
      getSubCategoryById,
      getCategoryById,
      getCategoryBySubCategoryId,
    };
  }, [categories, isLoading]);

  return (
    <ActivityCategoriesContext.Provider value={value}>
      {children}
    </ActivityCategoriesContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useActivityCategoriesContext = (): ActivityCategoriesContextValue => {
  const ctx = useContext(ActivityCategoriesContext);
  if (!ctx) {
    throw new Error(
      "useActivityCategoriesContext must be used inside <ActivityCategoriesProvider>"
    );
  }
  return ctx;
};
