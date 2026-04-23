import type { NextRequest } from "next/server";
import { createIssue, listIssues } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { CreateIssueInput } from "@/types/system";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    return ok("Issues fetched successfully", { issues: listIssues(user) });
  } catch (error) {
    return fail("Failed to fetch issues", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = getSystemSession(request);
    const body = (await request.json()) as CreateIssueInput;
    const issue = createIssue(user, body);
    return ok("Issue submitted successfully", { issue });
  } catch (error) {
    return fail("Issue submission failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
