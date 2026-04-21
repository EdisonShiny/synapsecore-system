import type { NextRequest } from "next/server";
import type { User } from "@/types";
import { getStore } from "@/src/services/mock-store";

export type Session = {
  user: User;
  token: string;
};

function findTokenUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer demo:")) {
    return null;
  }

  return authorization.replace("Bearer demo:", "").trim();
}

export function getSession(request: NextRequest): Session {
  const store = getStore();
  const headerUserId = request.headers.get("x-user-id");
  const tokenUserId = findTokenUserId(request);
  const resolvedUserId = headerUserId ?? tokenUserId ?? store.users.find((user) => user.role === "HQ")?.id ?? null;
  const user = store.users.find((entry) => entry.id === resolvedUserId);

  if (!user) {
    throw new Error("Authenticated user could not be resolved.");
  }

  return {
    user,
    token: `demo:${user.id}`
  };
}

export function assertHQ(user: User) {
  if (user.role !== "HQ") {
    throw new Error("Only HQ can perform this action.");
  }
}

export function assertBranchAccess<T extends { branch_id: string }>(user: User, record: T) {
  if (user.role === "HQ") {
    return;
  }

  if (user.branch_id !== record.branch_id) {
    throw new Error("Branch Office can only access branch-owned records.");
  }
}
