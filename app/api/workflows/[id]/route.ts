import type { NextRequest } from "next/server";
import { getWorkflowDetailForOffice, updateWorkflow } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { UpdateWorkflowInput } from "@/types/system";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    return ok("Workflow fetched successfully", getWorkflowDetailForOffice(user, params.id));
  } catch (error) {
    return fail("Failed to fetch workflow", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as UpdateWorkflowInput;
    const workflow = updateWorkflow(user, params.id, body);
    return ok("Workflow updated successfully", { workflow });
  } catch (error) {
    return fail("Workflow update failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
