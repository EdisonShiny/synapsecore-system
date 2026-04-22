import type { Project, User } from "@/types";
import { identifyProjectWithAi } from "@/src/services/ai-engine";
import { getStore } from "@/src/services/mock-store";
import { createInitialPhase, createInitialPhaseFromRecommendation } from "@/src/services/workflow";
import { nowIso } from "@/src/utils/date";
import { createId } from "@/src/utils/id";

export function listProjects(user: User) {
  const store = getStore();
  return user.role === "HQ" ? store.projects : store.projects.filter((project) => project.branch_id === user.branch_id);
}

export function getProjectById(projectId: string, user: User) {
  const project = listProjects(user).find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

export function createProject(payload: Omit<Project, "id" | "created_at" | "updated_at" | "approval_status"> & { approval_status?: Project["approval_status"] }) {
  const store = getStore();
  const project: Project = {
    ...payload,
    id: createId(),
    approval_status: payload.approval_status ?? "pending",
    created_at: nowIso(),
    updated_at: nowIso()
  };

  store.projects.unshift(project);
  store.phases.unshift(createInitialPhase(project.id, project.owner_role));

  return project;
}

export async function createProjectFromInput(inputId: string, user: User, confirmProjectCreation = true) {
  const store = getStore();
  const input = store.project_inputs.find((entry) => entry.id === inputId);

  if (!input) {
    throw new Error("Input not found.");
  }

  const analysis = store.ai_analysis.find((entry) => entry.input_id === input.id);

  if (!analysis) {
    throw new Error("AI analysis not found for the input.");
  }

  if (!confirmProjectCreation) {
    return {
      project_identification: null,
      project: null
    };
  }

  const uploadingUser = store.users.find((entry) => entry.id === input.uploaded_by) ?? user;
  const existingProject = input.project_id ? store.projects.find((entry) => entry.id === input.project_id) : null;
  const branchId = uploadingUser.branch_id ?? existingProject?.branch_id ?? user.branch_id ?? store.branches[0]?.id;

  if (!branchId) {
    throw new Error("No branch is available for project creation.");
  }
  const aiResult = await identifyProjectWithAi(input, analysis, user.id, branchId);
  const project = aiResult.project;

  input.project_id = project.id;
  store.projects.unshift(project);
  store.phases.unshift(
    createInitialPhaseFromRecommendation(project.id, project.owner_role, {
      phase_name: aiResult.project_identification.recommended_initial_phase,
      objective: `Prepare a grounded plan for ${aiResult.project_identification.recommended_initial_phase.toLowerCase()}.`,
      responsible_party: aiResult.project_identification.recommended_owner
    })
  );

  return aiResult;
}

export function updateProject(projectId: string, updates: Partial<Omit<Project, "id" | "created_at">>, user: User) {
  const project = getProjectById(projectId, user);
  Object.assign(project, updates, { updated_at: nowIso() });
  return project;
}
