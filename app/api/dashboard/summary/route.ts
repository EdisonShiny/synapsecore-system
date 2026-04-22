import type { NextRequest } from "next/server";
import { getDashboardSummary } from "@/src/modules/dashboard/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Dashboard summary fetched successfully", { summary: getDashboardSummary(user) });
  } catch (error) {
    return fail("Failed to fetch dashboard summary", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
