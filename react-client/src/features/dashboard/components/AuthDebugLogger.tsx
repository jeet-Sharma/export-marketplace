"use client";

import { useEffect } from "react";
import { getCookie } from "@/lib/cookies";

import { API_BASE_URL } from "@/store/baseApi";

/**
 * Client component that prints the cookie authentication data
 * directly to your browser DevTools Console tab when /dashboard mounts.
 */
export function AuthDebugLogger() {
  useEffect(() => {
    const token = getCookie("access_token");
    const rawUserData = getCookie("user_data");

    let parsedUser = null;
    if (rawUserData) {
      try {
        parsedUser = JSON.parse(rawUserData);
      } catch {
        parsedUser = rawUserData;
      }
    }

    console.log(
      "%c🍪 [DASHBOARD DEBUG INFO]",
      "background: #111827; color: #f43f5e; font-size: 13px; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
    );
    console.log("🌐 ACTIVE API URL:", API_BASE_URL);
    console.log("🔑 ACCESS TOKEN:", token);
    console.log("👤 USER OBJECT:", parsedUser);
    console.log("🛡️ USER ROLES:", parsedUser?.roles);
    console.log("📋 USER PERMISSIONS:", parsedUser?.permissions);
    console.log("📄 RAW document.cookie:", document.cookie);
  }, []);

  return null;
}
