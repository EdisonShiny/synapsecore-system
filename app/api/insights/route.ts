import type { NextRequest } from "next/server";
import { createPlanSubmission, listPlanInsights } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreatePlanSubmissionInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Plan insights fetched successfully", listPlanInsights(user));
  } catch (error) {
    return fail("Failed to fetch plan insights", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as CreatePlanSubmissionInput;
    const insight = createPlanSubmission(user, body);
    return ok("Plan insight generated successfully", { insight });
  } catch (error) {
    return fail("Plan insight generation failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
