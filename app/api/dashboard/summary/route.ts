import type { NextRequest } from "next/server";
import { buildDashboard } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Dashboard summary fetched successfully", { summary: buildDashboard(user) });
  } catch (error) {
    return fail("Failed to fetch dashboard summary", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
