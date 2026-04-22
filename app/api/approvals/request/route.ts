import type { NextRequest } from "next/server";
import { createApprovalRequest } from "@/src/modules/approvals/service";
import { fail, ok } from "@/src/utils/api";
import { getSession } from "@/src/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const { user } = getSession(request);
    const body = (await request.json()) as {
      project_id?: string;
      phase_id?: string | null;
      request_type?: string;
      request_summary?: string;
      ai_recommendation?: string;
      risk_level?: "low" | "medium" | "high";
    };

    if (!body.project_id) {
      return fail("Failed to create approval request", ["project_id is required."]);
    }

    const approval = await createApprovalRequest(
      {
        project_id: body.project_id,
        phase_id: body.phase_id ?? null,
        request_type: body.request_type,
        request_summary: body.request_summary,
        ai_recommendation: body.ai_recommendation,
        risk_level: body.risk_level
      },
      user
    );

    return ok("Approval request created successfully", { approval });
  } catch (error) {
    return fail("Failed to create approval request", [error instanceof Error ? error.message : "Unknown error"], 400);
  }
}
