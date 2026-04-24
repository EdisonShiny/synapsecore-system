import type { NextRequest } from "next/server";
import { getPhaseById, updatePhase } from "@/src/modules/phases/service";
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
    return ok("Phase fetched successfully", getPhaseById(id, user));
  } catch (error) {
    return fail("Failed to fetch phase", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const { id } = await params;
    const body = (await request.json()) as Partial<Omit<Phase, "id" | "project_id" | "created_at">>;
    return ok("Phase updated successfully", { phase: updatePhase(id, body, user) });
  } catch (error) {
    return fail("Failed to update phase", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
