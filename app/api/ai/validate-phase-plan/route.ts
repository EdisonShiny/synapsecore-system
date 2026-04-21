import type { NextRequest } from "next/server";
import { validateGeneratedPhasePlan } from "@/src/modules/ai/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as { phase_id?: string };

    if (!body.phase_id) {
      return fail("Failed to validate phase plan", ["phase_id is required."]);
    }

    return ok("Phase plan validated successfully", { validation: await validateGeneratedPhasePlan(body.phase_id, user) });
  } catch (error) {
    return fail("Failed to validate phase plan", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
