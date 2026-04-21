import type { NextRequest } from "next/server";
import { createExecutionUpdate } from "@/src/modules/execution_updates/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { ExecutionUpdate } from "@/types";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as Omit<ExecutionUpdate, "id" | "phase_id" | "submitted_at">;
    return ok("execution_update created successfully", await createExecutionUpdate(params.id, body, user));
  } catch (error) {
    return fail("Failed to create execution_update", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
