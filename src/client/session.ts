"use client";

import type { SystemSession } from "@/types/system";

const SESSION_STORAGE_KEY = "synapsecore-system-session";

export type DemoSession = SystemSession;

export const DEMO_LOGIN_OPTIONS = [
  {
    email: "branch@synapsecore.test",
    role: "Branch Office" as const,
    label: "Branch Office"
  },
  {
    email: "hq@synapsecore.test",
    role: "HQ" as const,
    label: "HQ"
  }
] as const;

export function readStoredSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeStoredSession(session: DemoSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
