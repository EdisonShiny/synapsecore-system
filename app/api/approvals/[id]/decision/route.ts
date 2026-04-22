import type { NextRequest } from "next/server";
import { decideApproval } from "@/src/modules/approvals/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";
import type { ApprovalStatus } from "@/types";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as {
      status?: ApprovalStatus;
      decision_note?: string | null;
    };

    if (!body.status) {
      return fail("Failed to decide approval", ["status is required."]);
    }

    const approval = decideApproval(params.id, { status: body.status, decision_note: body.decision_note ?? null }, user);
    return ok("Approval decision recorded successfully", { approval });
  } catch (error) {
    return fail("Failed to decide approval", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
