import type { NextRequest } from "next/server";
import { getProjectForOffice, submitProjectAppeal } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { AppealProjectInput } from "@/types/system";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const project = getProjectForOffice(id, user);
    return ok("Project fetched successfully", { project });
  } catch (error) {
    return fail("Failed to fetch project", [error instanceof Error ? error.message : "Unknown error"], 404);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as {
      action?: "appeal";
      payload?: AppealProjectInput;
    };

    if (body.action !== "appeal" || !body.payload) {
      return fail("Project update failed", ["Unsupported project action."]);
    }

    const project = submitProjectAppeal(user, id, body.payload);
    return ok("Project appeal submitted successfully", { project });
  } catch (error) {
    return fail("Project update failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
