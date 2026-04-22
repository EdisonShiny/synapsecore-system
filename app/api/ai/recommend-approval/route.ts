import type { NextRequest } from "next/server";
import { recommendApproval } from "@/src/modules/ai/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as { project_id?: string; phase_id?: string | null };

    if (!body.project_id) {
      return fail("Failed to recommend approval", ["project_id is required."]);
    }

    return ok(
      "Approval recommendation generated successfully",
      await recommendApproval(body.project_id, body.phase_id ?? null, user)
    );
  } catch (error) {
    return fail("Failed to recommend approval", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
