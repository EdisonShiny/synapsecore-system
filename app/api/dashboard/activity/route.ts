import type { NextRequest } from "next/server";
import { getDashboardActivity } from "@/src/modules/dashboard/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Dashboard activity fetched successfully", { activity: getDashboardActivity(user) });
  } catch (error) {
    return fail("Failed to fetch dashboard activity", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
