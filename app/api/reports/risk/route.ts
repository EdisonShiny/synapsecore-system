import type { NextRequest } from "next/server";
import { getRiskReport } from "@/src/modules/reports/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Risk report fetched successfully", { report: getRiskReport(user) });
  } catch (error) {
    return fail("Failed to fetch risk report", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
