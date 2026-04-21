import type { NextRequest } from "next/server";
import { getPhaseById, updatePhase } from "@/src/modules/phases/service";
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
    return ok("Phase fetched successfully", getPhaseById(params.id, user));
  } catch (error) {
    return fail("Failed to fetch phase", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Partial<Omit<Phase, "id" | "project_id" | "created_at">>;
    return ok("Phase updated successfully", { phase: updatePhase(params.id, body, user) });
  } catch (error) {
    return fail("Failed to update phase", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
