import type { NextRequest } from "next/server";
import { progressProjectPhase } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ProgressProjectPhaseInput } from "@/types/system";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as ProgressProjectPhaseInput;
    const project = await progressProjectPhase(user, id, body);
    return ok("Project phase progressed successfully", { project });
  } catch (error) {
    return fail("Project phase progression failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
