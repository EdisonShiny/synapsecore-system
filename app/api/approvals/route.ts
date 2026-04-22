import type { NextRequest } from "next/server";
import { listApprovals } from "@/src/modules/approvals/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = getSession(request);
    return ok("Approvals fetched successfully", { approvals: listApprovals(user) });
  } catch (error) {
    return fail("Failed to fetch approvals", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
