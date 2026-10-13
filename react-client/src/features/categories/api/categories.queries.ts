import { useQuery } from "@tanstack/react-query";
import { getCategories } from "./categories.api";

/** Query key factory, so invalidation/refetch call-sites never hand-roll the array shape. */
export const categoriesQueryKeys = {
  all: ["categories"] as const,
};

/** Fetches the active category list (GET /categories) via TanStack Query. */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKeys.all,
    queryFn: getCategories,
  });
}
