import { baseApi } from "@/store/baseApi";
import type { ApiCountry } from "../types/country-api.types";

/**
 * Countries endpoint injected into the shared baseApi (frontend-rules #11).
 * Replaces the previous TanStack Query wrapper so all server-state lives in
 * one RTK Query cache. Hook name is unchanged so all call-sites compile
 * without modification.
 */
const countriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /api/v1/countries — active countries for shipping/origin filters (public). */
    getCountries: builder.query<ApiCountry[], void>({
      query: () => "/countries",
      providesTags: [{ type: "Country", id: "LIST" }],
    }),
  }),
});

const { useGetCountriesQuery } = countriesApi;

/** Fetches the active country list (GET /countries) via RTK Query. */
export function useCountriesQuery() {
  return useGetCountriesQuery();
}

export { useGetCountriesQuery };
