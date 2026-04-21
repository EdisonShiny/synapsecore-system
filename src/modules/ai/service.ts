import { analyzeInputWithAi, recommendApprovalWithAi, reviewOutcomeWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { createProjectFromInput } from "@/src/modules/projects/service";
import { generatePlanForPhase, validatePhasePlan } from "@/src/modules/phases/service";
import type { User } from "@/types";

export async function analyzeInput(inputId: string, user: User) {
  const store = getStore();
  const input = store.project_inputs.find((entry) => entry.id === inputId);

  if (!input) {
    throw new Error("Input not found.");
  }

  const inputOwner = store.users.find((entry) => entry.id === input.uploaded_by);
  const projectBranchId = input.project_id ? store.projects.find((project) => project.id === input.project_id)?.branch_id : null;
  const branchName =
    store.branches.find((branch) => branch.id === projectBranchId)?.name ??
    store.branches.find((branch) => branch.id === inputOwner?.branch_id)?.name ??
    store.branches.find((branch) => branch.id === user.branch_id)?.name ??
    "HQ";

  const analysis = await analyzeInputWithAi(input, branchName);
  store.ai_analysis.unshift(analysis);
  return analysis;
}

export async function createProjectFromAnalyzedInput(inputId: string, user: User, confirmProjectCreation = true) {
  return createProjectFromInput(inputId, user, confirmProjectCreation);
}

export async function generatePhasePlan(phaseId: string, user: User) {
  return generatePlanForPhase(phaseId, user);
}

export async function validateGeneratedPhasePlan(phaseId: string, user: User) {
  return validatePhasePlan(phaseId, user);
}

export async function reviewOutcome(executionUpdateId: string, user: User) {
  const store = getStore();
  const executionUpdate = store.execution_updates.find((entry) => entry.id === executionUpdateId);

  if (!executionUpdate) {
    throw new Error("execution_update not found.");
  }

  const phase = store.phases.find((entry) => entry.id === executionUpdate.phase_id);

  if (!phase) {
    throw new Error("Phase not found.");
  }

  const project = store.projects.find((entry) => entry.id === phase.project_id);
  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only review outcome for its own branch.");
  }

  return reviewOutcomeWithAi(executionUpdate, phase);
}

export async function recommendApproval(projectId: string, phaseId: string | null, user: User) {
  const store = getStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only request recommendation for its own branch.");
  }

  const phase = phaseId ? store.phases.find((entry) => entry.id === phaseId) ?? null : null;
  const validation = phase ? store.validations.find((entry) => entry.phase_id === phase.id) ?? null : null;

  return recommendApprovalWithAi(project, phase, validation);
}
