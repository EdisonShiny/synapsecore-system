import type { NextRequest } from "next/server";
import { getDashboardAlerts } from "@/src/modules/dashboard/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Dashboard alerts fetched successfully", { alerts: getDashboardAlerts(user) });
  } catch (error) {
    return fail("Failed to fetch dashboard alerts", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
