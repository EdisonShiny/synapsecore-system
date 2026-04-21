import type { Approval, Phase, Project, Validation } from "@/types";
import { nowIso, plusDays } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export function createInitialPhase(projectId: string, ownerRole: Project["owner_role"]): Phase {
  return {
    id: createId(),
    project_id: projectId,
    phase_name: "Initial assessment",
    phase_order: 1,
    objective: "Confirm the project objective and prepare the first plan.",
    responsible_party: ownerRole,
    status: "pending",
    due_date: plusDays(3),
    created_at: nowIso(),
    updated_at: nowIso()
  };
}

export function applyValidationToPhase(phase: Phase, project: Project, validation: Validation) {
  phase.status = "validating";
  phase.updated_at = nowIso();
  project.status = "validation_pending";
  project.updated_at = nowIso();

  if (validation.proceed_recommendation === "do_not_proceed") {
    project.status = "escalated";
  }
}

export function applyApprovalDecision(project: Project, phase: Phase | undefined, approval: Approval) {
  project.approval_status = approval.status;
  project.updated_at = nowIso();

  if (approval.status === "approved") {
    project.status = "executing";
    if (phase) {
      phase.status = "approved";
      phase.updated_at = nowIso();
    }
  }

  if (approval.status === "rejected" || approval.status === "revise_requested") {
    project.status = "validation_pending";
    if (phase) {
      phase.status = "validating";
      phase.updated_at = nowIso();
    }
  }

  if (approval.status === "escalated") {
    project.status = "escalated";
    if (phase) {
      phase.status = "blocked";
      phase.updated_at = nowIso();
    }
  }
}
