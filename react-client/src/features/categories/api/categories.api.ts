import { apiClient } from "@/lib/api/client";
import type { ApiCategory } from "../types/category-api.types";

/** GET /categories — active categories for navigation/filtering (section 11, public). */
export async function getCategories(): Promise<ApiCategory[]> {
  const { data } = await apiClient.get<ApiCategory[]>("/categories");
  return data;
}
