"use client";
import { useEffect, useState } from "react";
import { loadSession, type Session } from "@/lib/api";

/** Current session from localStorage; updates on login/logout in this or another tab. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setSession(loadSession());
    read();
    setReady(true);
    window.addEventListener("pulsa-session", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("pulsa-session", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return { session, ready };
}
