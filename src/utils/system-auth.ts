import type { NextRequest } from "next/server";
import { getOfficeSessionUser } from "@/src/modules/system/service";
import type { SystemSession } from "@/types/system";

function readTokenUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer system:")) {
    return null;
  }

  return authorization.replace("Bearer system:", "").trim();
}

export function getSystemSession(request: NextRequest): SystemSession {
  const userId = request.headers.get("x-user-id") ?? readTokenUserId(request);

  if (!userId) {
    throw new Error("Authentication is required.");
  }

  const user = getOfficeSessionUser(userId);
  return {
    token: `system:${user.id}`,
    user
  };
}
