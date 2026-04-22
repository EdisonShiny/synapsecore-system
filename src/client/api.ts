"use client";

import type { ApiResponse } from "@/types";
import type { DemoSession } from "@/src/client/session";

type RequestOptions = RequestInit & {
  json?: unknown;
  session?: DemoSession | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { json, session, headers, ...init } = options;
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session
        ? {
            Authorization: `Bearer ${session.token}`,
            "x-user-id": session.user.id
          }
        : {}),
      ...(headers ?? {})
    },
    body: json === undefined ? undefined : JSON.stringify(json)
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.errors.join(" "));
  }

  return payload.data;
}
