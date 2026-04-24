import type { NextRequest } from "next/server";
import { replyToIssue } from "@/src/modules/system/service";
import { fail, ok } from "@/src/utils/api";
import { getSystemSession } from "@/src/utils/system-auth";
import type { ReplyIssueInput } from "@/types/system";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = getSystemSession(request);
    const { id } = await params;
    const body = (await request.json()) as ReplyIssueInput;

    if (!body.message) {
      return fail("Issue reply failed", ["message is required."]);
    }

    const issue = replyToIssue(user, id, body);
    return ok("Issue reply saved successfully", { issue });
  } catch (error) {
    return fail("Issue reply failed", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
