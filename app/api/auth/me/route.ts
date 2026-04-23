import type { NextRequest } from "next/server";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSystemSession(request);
    return ok("User fetched successfully", { user: session.user, token: session.token });
  } catch (error) {
    return fail("Failed to fetch current user", [error instanceof Error ? error.message : "Unknown error"], 401);
  }
}
