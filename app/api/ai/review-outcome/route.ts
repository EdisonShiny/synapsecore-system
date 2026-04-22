import type { NextRequest } from "next/server";
import { reviewOutcome } from "@/src/modules/ai/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as { execution_update_id?: string };

    if (!body.execution_update_id) {
      return fail("Failed to review outcome", ["execution_update_id is required."]);
    }

    return ok("Outcome reviewed successfully", await reviewOutcome(body.execution_update_id, user));
  } catch (error) {
    return fail("Failed to review outcome", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
