import type { NextRequest } from "next/server";
import { loginOffice } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import type { OfficeRole } from "@/types/system";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; role?: OfficeRole };

    if (!body.email || !body.role) {
      return fail("Login failed", ["email and role are required."]);
    }

    const result = loginOffice(body.email, body.role);
    return ok("Login successful", result);
  } catch (error) {
    return fail("Login failed", [error instanceof Error ? error.message : "Unknown error"], 401);
  }
}
