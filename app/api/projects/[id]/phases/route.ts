import type { NextRequest } from "next/server";
import { createPhase, listProjectPhases } from "@/src/modules/phases/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { Phase } from "@/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const { id } = await params;
    return ok("Project phases fetched successfully", { phases: listProjectPhases(id, user) });
  } catch (error) {
    return fail("Failed to fetch project phases", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const { id } = await params;
    const body = (await request.json()) as Omit<Phase, "id" | "project_id" | "created_at" | "updated_at">;
    return ok("Phase created successfully", { phase: createPhase(id, body, user) });
  } catch (error) {
    return fail("Failed to create phase", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
