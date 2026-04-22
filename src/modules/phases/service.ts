import type { Phase, User } from "@/types";
import { generatePhasePlanWithAi, validatePlanWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { applyValidationToPhase } from "@/src/services/workflow";
import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export function listProjectPhases(projectId: string, user: User) {
  const store = getStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only access phases from its own branch.");
  }

  return store.phases
    .filter((phase) => phase.project_id === projectId)
    .sort((left, right) => left.phase_order - right.phase_order);
}

export function getPhaseById(phaseId: string, user: User) {
  const store = getStore();
  const phase = store.phases.find((entry) => entry.id === phaseId);

  if (!phase) {
    throw new Error("Phase not found.");
  }

  const project = store.projects.find((entry) => entry.id === phase.project_id);
  if (!project) {
    throw new Error("Project not found for phase.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only access phases from its own branch.");
  }

  return {
    phase,
    plan: store.plans.find((entry) => entry.phase_id === phase.id) ?? null,
    validation: store.validations.find((entry) => entry.phase_id === phase.id) ?? null,
    execution_updates: store.execution_updates.filter((entry) => entry.phase_id === phase.id)
  };
}

export function createPhase(projectId: string, payload: Omit<Phase, "id" | "project_id" | "created_at" | "updated_at">, user: User) {
  const store = getStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only add phases to its own branch project.");
  }

  const phase: Phase = {
    ...payload,
    id: createId(),
    project_id: projectId,
    created_at: nowIso(),
    updated_at: nowIso()
  };

  store.phases.push(phase);
  project.updated_at = nowIso();

  return phase;
}

export function updatePhase(phaseId: string, updates: Partial<Omit<Phase, "id" | "project_id" | "created_at">>, user: User) {
  const phase = getPhaseById(phaseId, user).phase;
  Object.assign(phase, updates, { updated_at: nowIso() });
  return phase;
}

export async function generatePlanForPhase(phaseId: string, user: User) {
  const store = getStore();
  const { phase } = getPhaseById(phaseId, user);
  const project = store.projects.find((entry) => entry.id === phase.project_id) ?? null;
  const aiResult = await generatePhasePlanWithAi(phase, { project });
  const plan = aiResult.plan;
  const existing = store.plans.findIndex((entry) => entry.phase_id === phaseId);

  if (existing >= 0) {
    store.plans[existing] = plan;
  } else {
    store.plans.unshift(plan);
  }

  phase.status = "planned";
  phase.updated_at = nowIso();

  return {
    phase_plan_generation: aiResult.phase_plan_generation,
    plan
  };
}

export async function validatePhasePlan(phaseId: string, user: User) {
  const store = getStore();
  const { phase } = getPhaseById(phaseId, user);
  const project = store.projects.find((entry) => entry.id === phase.project_id);
  const plan = store.plans.find((entry) => entry.phase_id === phase.id);

  if (!project || !plan) {
    throw new Error("Plan not found for phase.");
  }

  const aiResult = await validatePlanWithAi(phase, plan, { project });
  const validation = aiResult.validation_record;
  const existing = store.validations.findIndex((entry) => entry.phase_id === phase.id);

  if (existing >= 0) {
    store.validations[existing] = validation;
  } else {
    store.validations.unshift(validation);
  }

  applyValidationToPhase(phase, project, validation);

  return {
    validation: aiResult.validation,
    validation_record: validation
  };
}
