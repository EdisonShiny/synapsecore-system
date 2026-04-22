"use client";

import type { User } from "@/types";

const SESSION_STORAGE_KEY = "synapsecore-demo-session";

export type DemoSession = {
  token: string;
  user: User;
};

export const DEMO_LOGIN_OPTIONS = [
  {
    email: "north.branch@synapsecore.local",
    role: "Branch Office" as const,
    label: "North Branch"
  },
  {
    email: "south.branch@synapsecore.local",
    role: "Branch Office" as const,
    label: "South Branch"
  },
  {
    email: "central.branch@synapsecore.local",
    role: "Branch Office" as const,
    label: "Central Branch"
  },
  {
    email: "hq@synapsecore.local",
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
