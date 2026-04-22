"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/src/client/api";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type DemoSession
} from "@/src/client/session";

export function useDemoSession(required = true) {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const storedSession = readStoredSession();

      if (!storedSession) {
        if (active) {
          setSession(null);
          setLoading(false);
        }

        if (required) {
          router.replace("/login");
        }

        return;
      }

      try {
        const data = await apiRequest<{ user: DemoSession["user"]; token: string }>(
          "/api/auth/me",
          { session: storedSession }
        );
        const nextSession = {
          token: data.token,
          user: data.user
        };

        writeStoredSession(nextSession);

        if (active) {
          setSession(nextSession);
        }
      } catch {
        clearStoredSession();

        if (active) {
          setSession(null);
        }

        if (required) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [required, router]);

  function persistSession(nextSession: DemoSession) {
    writeStoredSession(nextSession);
    setSession(nextSession);
  }

  function signOut() {
    clearStoredSession();
    setSession(null);
    router.replace("/login");
  }

  return {
    session,
    loading,
    setSession: persistSession,
    signOut
  };
}
