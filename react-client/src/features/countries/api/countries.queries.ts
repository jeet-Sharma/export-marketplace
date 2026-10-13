import { useQuery } from "@tanstack/react-query";
import { getCountries } from "./countries.api";

export const countriesQueryKeys = {
  all: ["countries"] as const,
};

/** Fetches the active country list (GET /countries) via TanStack Query. */
export function useCountriesQuery() {
  return useQuery({
    queryKey: countriesQueryKeys.all,
    queryFn: getCountries,
  });
}
