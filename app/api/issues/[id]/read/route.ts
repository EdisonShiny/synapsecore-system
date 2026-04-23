import type { NextRequest } from "next/server";
import { markIssueAsRead } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = getSystemSession(request);
    const issue = markIssueAsRead(user, params.id);
    return ok("Issue marked as read", { issue });
  } catch (error) {
    return fail("Failed to mark issue as read", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
