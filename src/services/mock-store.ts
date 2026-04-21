import { seedData } from "@/mocks/synapse-data";
import type {
  AiAnalysis,
  Approval,
  Branch,
  ExecutionUpdate,
  Phase,
  Plan,
  Project,
  ProjectInput,
  User,
  Validation
} from "@/types";

export type MockDatabase = {
  branches: Branch[];
  users: User[];
  projects: Project[];
  project_inputs: ProjectInput[];
  ai_analysis: AiAnalysis[];
  phases: Phase[];
  plans: Plan[];
  validations: Validation[];
  execution_updates: ExecutionUpdate[];
  approvals: Approval[];
};

const globalStore = globalThis as typeof globalThis & {
  synapsecoreStore?: MockDatabase;
};

function toMockUuid(seed: string) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(seed)) {
    return seed;
  }

  let hex = "";
  for (const character of seed) {
    hex += character.charCodeAt(0).toString(16).padStart(2, "0");
  }

  const normalized = (hex + "0123456789abcdef0123456789abcdef").slice(0, 32);
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-4${normalized.slice(13, 16)}-8${normalized.slice(17, 20)}-${normalized.slice(20, 32)}`;
}

function normalizeSeedData(database: MockDatabase): MockDatabase {
  return {
    branches: database.branches.map((branch) => ({
      ...branch,
      id: toMockUuid(branch.id)
    })),
    users: database.users.map((user) => ({
      ...user,
      id: toMockUuid(user.id),
      branch_id: user.branch_id ? toMockUuid(user.branch_id) : null
    })),
    projects: database.projects.map((project) => ({
      ...project,
      id: toMockUuid(project.id),
      branch_id: toMockUuid(project.branch_id),
      created_by: toMockUuid(project.created_by)
    })),
    project_inputs: database.project_inputs.map((input) => ({
      ...input,
      id: toMockUuid(input.id),
      project_id: input.project_id ? toMockUuid(input.project_id) : null,
      uploaded_by: toMockUuid(input.uploaded_by)
    })),
    ai_analysis: database.ai_analysis.map((analysis) => ({
      ...analysis,
      id: toMockUuid(analysis.id),
      input_id: toMockUuid(analysis.input_id)
    })),
    phases: database.phases.map((phase) => ({
      ...phase,
      id: toMockUuid(phase.id),
      project_id: toMockUuid(phase.project_id)
    })),
    plans: database.plans.map((plan) => ({
      ...plan,
      id: toMockUuid(plan.id),
      phase_id: toMockUuid(plan.phase_id)
    })),
    validations: database.validations.map((validation) => ({
      ...validation,
      id: toMockUuid(validation.id),
      phase_id: toMockUuid(validation.phase_id)
    })),
    execution_updates: database.execution_updates.map((executionUpdate) => ({
      ...executionUpdate,
      id: toMockUuid(executionUpdate.id),
      phase_id: toMockUuid(executionUpdate.phase_id),
      submitted_by: toMockUuid(executionUpdate.submitted_by)
    })),
    approvals: database.approvals.map((approval) => ({
      ...approval,
      id: toMockUuid(approval.id),
      project_id: toMockUuid(approval.project_id),
      phase_id: approval.phase_id ? toMockUuid(approval.phase_id) : null,
      decided_by: approval.decided_by ? toMockUuid(approval.decided_by) : null
    }))
  };
}

function cloneSeed(): MockDatabase {
  return normalizeSeedData(structuredClone(seedData));
}

export function getStore() {
  if (!globalStore.synapsecoreStore) {
    globalStore.synapsecoreStore = cloneSeed();
  }

  return globalStore.synapsecoreStore;
}

export function resetStore() {
  globalStore.synapsecoreStore = cloneSeed();
  return globalStore.synapsecoreStore;
}
