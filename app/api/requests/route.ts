import type { NextRequest } from "next/server";
import {
  createRequestApplication,
  getRequestsPayloadForOffice
} from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreateRequestApplicationInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Requests fetched successfully", getRequestsPayloadForOffice(user));
  } catch (error) {
    return fail("Failed to fetch requests", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as CreateRequestApplicationInput;
    const requestRecord = await createRequestApplication(user, body);
    return ok("Request application created successfully", { request: requestRecord });
  } catch (error) {
    return fail("Request application failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
