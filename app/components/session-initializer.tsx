"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStoredSession } from "../lib/auth";

/**
 * Initializes the session from localStorage on app load.
 * This ensures the session persists across page refreshes.
 */
export function SessionInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    const session = getStoredSession();

    if (pathname === "/login") {
      return;
    }

    if (session) {
      console.log("✅ Session found on refresh for", pathname);
    } else {
      console.log("⚠️ No session found on refresh for", pathname);
    }
  }, [pathname]);

  return null;
}
