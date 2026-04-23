import type { NextRequest } from "next/server";
import { clearOfficeData } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    clearOfficeData(user);
    return ok("Workflow data cleared successfully", { cleared: true });
  } catch (error) {
    return fail("Failed to clear workflow data", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
