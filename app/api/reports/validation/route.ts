import type { NextRequest } from "next/server";
import { getValidationReport } from "@/src/modules/reports/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Validation report fetched successfully", { report: getValidationReport(user) });
  } catch (error) {
    return fail("Failed to fetch validation report", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
