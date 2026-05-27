"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredSession } from "../lib/auth";

/**
 * Initializes the session from localStorage on app load.
 * This ensures the session persists across page refreshes.
 */
export function SessionInitializer() {
  const router = useRouter();

  useEffect(() => {
    // Check if session exists in localStorage
    const session = getStoredSession();

    // If no session, redirect to login
    if (!session) {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
