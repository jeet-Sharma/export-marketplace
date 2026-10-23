import { baseApi } from "@/store/baseApi";
import type { ApiCategory } from "@/features/categories/types/category-api.types";
import type { ApiCountry } from "@/features/countries/types/country-api.types";

/**
 * Reference-data lookups (categories, countries) used by the Add product
 * modal's "Category"/"Shipping country" dropdowns. Both GET /categories and
 * GET /countries are public endpoints (section 11), but injected on the
 * same shared baseApi as the rest of the dashboard (frontend-rules #10/#11)
 * instead of the standalone axios client in features/categories|countries,
 * so there's one cache and the dashboard doesn't depend on two separate
 * data-fetching stacks for the same session.
 */
export const referenceDataApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCategoryOptions: builder.query<ApiCategory[], void>({
      query: () => ({ url: "/categories" }),
      providesTags: [{ type: "Category" as const, id: "LIST" }],
    }),
    getCountryOptions: builder.query<ApiCountry[], void>({
      query: () => ({ url: "/countries" }),
      providesTags: [{ type: "Country" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetCategoryOptionsQuery, useGetCountryOptionsQuery } =
  referenceDataApi;
