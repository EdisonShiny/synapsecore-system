import type { ExecutionUpdate, Phase, User } from "@/types";
import { reviewOutcomeWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export async function createExecutionUpdate(
  phaseId: string,
  payload: Omit<ExecutionUpdate, "id" | "phase_id" | "submitted_at">,
  user: User
) {
  const store = getStore();
  const phase = store.phases.find((entry) => entry.id === phaseId);

  if (!phase) {
    throw new Error("Phase not found.");
  }

  const project = store.projects.find((entry) => entry.id === phase.project_id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only submit execution_update for its own branch.");
  }

  const executionUpdate: ExecutionUpdate = {
    ...payload,
    id: createId(),
    phase_id: phaseId,
    submitted_at: nowIso()
  };

  store.execution_updates.unshift(executionUpdate);

  if (executionUpdate.success_level === "failed") {
    phase.status = "blocked";
    project.status = "escalated";
  } else if (executionUpdate.success_level === "successful") {
    phase.status = "completed";
    project.status = "executing";
  } else {
    phase.status = "executing";
    project.status = "executing";
  }

  phase.updated_at = nowIso();
  project.updated_at = nowIso();

  const aiResult = await reviewOutcomeWithAi(executionUpdate, phase, project);
  const outcome_review = aiResult.review;

  let next_phase: Phase | null = null;
  if (outcome_review.next_phase_needed) {
    const existingNextPhase = store.phases.find(
      (entry) => entry.project_id === project.id && entry.phase_order === phase.phase_order + 1
    );

    if (existingNextPhase) {
      next_phase = existingNextPhase;
    } else {
      next_phase = {
        id: createId(),
        project_id: project.id,
        phase_name: outcome_review.recommended_phase,
        phase_order: phase.phase_order + 1,
        objective: outcome_review.summary,
        responsible_party: "HQ",
        status: "pending",
        due_date: outcome_review.due_date,
        created_at: nowIso(),
        updated_at: nowIso()
      };

      store.phases.push(next_phase);
    }
  }

  return {
    execution_update: executionUpdate,
    outcome_review: aiResult.outcome_review,
    next_phase
  };
}
