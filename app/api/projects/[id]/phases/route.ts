import type { NextRequest } from "next/server";
import { createPhase, listProjectPhases } from "@/src/modules/phases/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { Phase } from "@/types";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    return ok("Project phases fetched successfully", { phases: listProjectPhases(params.id, user) });
  } catch (error) {
    return fail("Failed to fetch project phases", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Omit<Phase, "id" | "project_id" | "created_at" | "updated_at">;
    return ok("Phase created successfully", { phase: createPhase(params.id, body, user) });
  } catch (error) {
    return fail("Failed to create phase", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
