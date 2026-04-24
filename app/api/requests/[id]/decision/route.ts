import type { NextRequest } from "next/server";
import { decideRequestApplication } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ProjectDecisionInput } from "@/types/system";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as ProjectDecisionInput;
    const requestRecord = decideRequestApplication(user, params.id, body);
    return ok("Request decision submitted successfully", { request: requestRecord });
  } catch (error) {
    return fail("Request decision failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
