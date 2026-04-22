import type { NextRequest } from "next/server";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    return ok("User fetched successfully", { user: session.user, token: session.token });
  } catch (error) {
    return fail("Failed to fetch current user", [error instanceof Error ? error.message : "Unknown error"], 401);
  }
}
