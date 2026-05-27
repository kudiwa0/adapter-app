"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredSession } from "../lib/auth";

/**
 * Initializes the session from localStorage on app load.
 * This ensures the session persists across page refreshes.
 */
export function SessionInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Skip check on login page
    if (pathname === "/login") {
      setIsChecked(true);
      return;
    }

    // Check if session exists in localStorage after hydration
    const session = getStoredSession();

    // If no session and not on login page, redirect to login
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }

    setIsChecked(true);
  }, [pathname, router]);

  return null;
}
