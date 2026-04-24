import type { NextRequest } from "next/server";
import { getSystemSettings, updateSystemAiConfig } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { UpdateSystemAiConfigInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    getSystemSession(request);
    return ok("System settings fetched successfully", getSystemSettings());
  } catch (error) {
    return fail("Failed to fetch system settings", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as UpdateSystemAiConfigInput;
    const settings = updateSystemAiConfig(user, body);
    return ok("System AI configuration updated successfully", settings);
  } catch (error) {
    return fail("Failed to update system AI configuration", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
