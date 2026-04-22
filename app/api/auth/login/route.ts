import type { NextRequest } from "next/server";
import { login } from "@/src/modules/auth/service";
import { fail, ok } from "@/src/utils/api";
import type { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; role?: UserRole };

    if (!body.email || !body.role) {
      return fail("Login failed", ["email and role are required."]);
    }

    const result = login(body.email, body.role);
    return ok("Login successful", result);
  } catch (error) {
    return fail("Login failed", [error instanceof Error ? error.message : "Unknown error"], 401);
  }
}
