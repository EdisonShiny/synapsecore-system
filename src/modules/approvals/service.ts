import type { Approval, User } from "@/types";
import { recommendApprovalWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { applyApprovalDecision } from "@/src/services/workflow";
import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export function listApprovals(user: User) {
  const store = getStore();
  if (user.role === "HQ") {
    return store.approvals;
  }

  return store.approvals.filter((approval) => {
    const project = store.projects.find((entry) => entry.id === approval.project_id);
    return project?.branch_id === user.branch_id;
  });
}

export async function createApprovalRequest(
  payload: Pick<Approval, "project_id" | "phase_id"> & Partial<Pick<Approval, "request_type" | "request_summary" | "ai_recommendation" | "risk_level">>,
  user: User
) {
  const store = getStore();
  const project = store.projects.find((entry) => entry.id === payload.project_id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only request approval for its own branch.");
  }

  const phase = payload.phase_id ? store.phases.find((entry) => entry.id === payload.phase_id) ?? null : null;
  const validation = phase ? store.validations.find((entry) => entry.phase_id === phase.id) ?? null : null;
  const recommendation = await recommendApprovalWithAi(project, phase, validation);

  const approval: Approval = {
    id: createId(),
    project_id: payload.project_id,
    phase_id: payload.phase_id ?? null,
    request_type: payload.request_type ?? recommendation.request_type,
    request_summary: payload.request_summary ?? recommendation.request_summary,
    ai_recommendation: payload.ai_recommendation ?? recommendation.ai_recommendation,
    risk_level: payload.risk_level ?? recommendation.risk_level,
    decision: null,
    decision_note: null,
    decided_by: null,
    decided_at: null,
    status: "pending"
  };

  store.approvals.unshift(approval);
  project.status = "approval_pending";
  project.approval_status = "pending";
  project.updated_at = nowIso();

  return approval;
}

export function decideApproval(
  approvalId: string,
  payload: Pick<Approval, "status" | "decision_note">,
  user: User
) {
  const store = getStore();
  const approval = store.approvals.find((entry) => entry.id === approvalId);

  if (!approval) {
    throw new Error("Approval not found.");
  }

  if (user.role !== "HQ") {
    throw new Error("Only HQ can make approval decisions.");
  }

  if (payload.status === "pending") {
    throw new Error("Approval decision cannot remain pending.");
  }

  approval.status = payload.status;
  approval.decision = payload.status;
  approval.decision_note = payload.decision_note ?? null;
  approval.decided_by = user.id;
  approval.decided_at = nowIso();

  const project = store.projects.find((entry) => entry.id === approval.project_id);
  const phase = approval.phase_id ? store.phases.find((entry) => entry.id === approval.phase_id) : undefined;

  if (project) {
    applyApprovalDecision(project, phase, approval);
  }

  return approval;
}
