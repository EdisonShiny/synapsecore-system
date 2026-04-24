import type { NextRequest } from "next/server";
import { reapplyRequestApplication } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ReapplyRequestApplicationInput } from "@/types/system";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as ReapplyRequestApplicationInput;
    const requestRecord = await reapplyRequestApplication(user, id, body);
    return ok("Request application reapplied successfully", { request: requestRecord });
  } catch (error) {
    return fail("Request reapplication failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
