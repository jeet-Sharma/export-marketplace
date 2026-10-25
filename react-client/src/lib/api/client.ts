import axios from "axios";
import { resolveApiBaseUrl } from "./resolveApiBaseUrl";

/**
 * Shared axios instance for every API call in the app. Centralizes the
 * base URL so it's never repeated per call-site — see frontend-rules.md
 * section 11 ("API base query" / "do not repeat API base URLs").
 *
 * Server vs browser host selection lives in resolveApiBaseUrl().
 */
const baseURL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});
