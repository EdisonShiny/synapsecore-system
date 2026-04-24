import type { NextRequest } from "next/server";
import { createWorkflow, listWorkflowsForOffice } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreateWorkflowInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Workflows fetched successfully", {
      workflows: listWorkflowsForOffice(user)
    });
  } catch (error) {
    return fail("Failed to fetch workflows", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as CreateWorkflowInput;
    const workflow = createWorkflow(user, body);
    return ok("Workflow created successfully", { workflow });
  } catch (error) {
    return fail("Workflow creation failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
