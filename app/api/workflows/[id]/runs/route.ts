import type { NextRequest } from "next/server";
import { listWorkflowRunsForOffice, runWorkflow } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ExecuteWorkflowInput } from "@/types/system";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    return ok("Workflow runs fetched successfully", {
      runs: listWorkflowRunsForOffice(user, id)
    });
  } catch (error) {
    return fail("Failed to fetch workflow runs", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as ExecuteWorkflowInput;
    const run = await runWorkflow(user, id, body);
    return ok("Workflow executed successfully", { run });
  } catch (error) {
    return fail("Workflow execution failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
