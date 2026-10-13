import { apiClient } from "@/lib/api/client";
import type { ApiCountry } from "../types/country-api.types";

/** GET /api/v1/countries — active countries for shipping/origin filters (public). */
export async function getCountries(): Promise<ApiCountry[]> {
  const { data } = await apiClient.get<ApiCountry[]>("/countries");
  return data;
}
