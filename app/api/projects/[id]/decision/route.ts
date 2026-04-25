import type { NextRequest } from "next/server";
import { decideProject } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ProjectDecisionInput } from "@/types/system";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as ProjectDecisionInput;
    const project = decideProject(user, id, body);
    return ok("Project decision submitted successfully", { project });
  } catch (error) {
    return fail("Project decision failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
