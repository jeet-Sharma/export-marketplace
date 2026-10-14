import { baseApi } from "@/store/baseApi";
import type { ApiCategory } from "../types/category-api.types";

/**
 * Categories endpoint injected into the shared baseApi (frontend-rules #11).
 * Replaces the previous TanStack Query wrapper so all server-state lives in
 * one RTK Query cache. Hook name is unchanged so all call-sites compile
 * without modification.
 */
const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /api/v1/categories — active categories for navigation/filtering (section 11). */
    getCategories: builder.query<ApiCategory[], void>({
      query: () => "/categories",
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
  }),
});

const { useGetCategoriesQuery } = categoriesApi;

/** Fetches the active category list (GET /categories) via RTK Query. */
export function useCategoriesQuery() {
  return useGetCategoriesQuery();
}

export { useGetCategoriesQuery };
