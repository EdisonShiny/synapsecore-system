import type { BranchReport, ProjectReport, RiskReport, User, ValidationReport } from "@/types";
import { getStore } from "@/src/services/mock-store";

export function getProjectReport(projectId: string, user: User): ProjectReport {
  const store = getStore();
  const project = store.projects.find((entry) => entry.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (user.role !== "HQ" && project.branch_id !== user.branch_id) {
    throw new Error("Branch Office can only access project reports from its own branch.");
  }

  return {
    project,
    branch: store.branches.find((entry) => entry.id === project.branch_id) ?? null,
    inputs: store.project_inputs.filter((input) => input.project_id === project.id),
    ai_analysis: store.ai_analysis.filter((entry) =>
      store.project_inputs.some((input) => input.id === entry.input_id && input.project_id === project.id)
    ),
    phases: store.phases
      .filter((phase) => phase.project_id === project.id)
      .sort((left, right) => left.phase_order - right.phase_order)
      .map((phase) => ({
        phase,
        plan: store.plans.find((entry) => entry.phase_id === phase.id) ?? null,
        validation: store.validations.find((entry) => entry.phase_id === phase.id) ?? null,
        execution_updates: store.execution_updates.filter((entry) => entry.phase_id === phase.id),
        approval: store.approvals.find((entry) => entry.phase_id === phase.id) ?? null
      })),
    latest_approval:
      store.approvals
        .filter((entry) => entry.project_id === project.id)
        .sort((left, right) => {
          const leftDate = left.decided_at ?? "";
          const rightDate = right.decided_at ?? "";
          return rightDate.localeCompare(leftDate);
        })[0] ?? null
  };
}

export function getBranchReport(branchId: string, user: User): BranchReport {
  const store = getStore();
  const branch = store.branches.find((entry) => entry.id === branchId);

  if (!branch) {
    throw new Error("Branch not found.");
  }

  if (user.role !== "HQ" && user.branch_id !== branchId) {
    throw new Error("Branch Office can only access its own branch report.");
  }

  const projects = store.projects.filter((project) => project.branch_id === branchId);
  const projectIds = new Set(projects.map((project) => project.id));
  const phaseIds = new Set(store.phases.filter((phase) => projectIds.has(phase.project_id)).map((phase) => phase.id));

  return {
    branch,
    projects,
    approvals: store.approvals.filter((approval) => projectIds.has(approval.project_id)),
    validation_warnings: store.validations.filter(
      (validation) =>
        phaseIds.has(validation.phase_id) &&
        (validation.human_review_level !== "optional" || validation.missing_information.length > 0)
    ),
    execution_updates: store.execution_updates.filter((executionUpdate) => phaseIds.has(executionUpdate.phase_id))
  };
}

export function getRiskReport(user: User): RiskReport {
  const store = getStore();
  const allowedProjects = user.role === "HQ" ? store.projects : store.projects.filter((project) => project.branch_id === user.branch_id);
  const projectIds = new Set(allowedProjects.map((project) => project.id));

  return {
    high_risk_projects: allowedProjects.filter((project) => project.priority === "high" || project.priority === "critical"),
    escalated_projects: allowedProjects.filter((project) => project.status === "escalated"),
    blocked_phases: store.phases.filter((phase) => projectIds.has(phase.project_id) && phase.status === "blocked"),
    approvals_requiring_attention: store.approvals.filter(
      (approval) => projectIds.has(approval.project_id) && (approval.status === "pending" || approval.status === "revise_requested" || approval.status === "escalated")
    )
  };
}

export function getValidationReport(user: User): ValidationReport {
  const store = getStore();
  const allowedProjects = user.role === "HQ" ? store.projects : store.projects.filter((project) => project.branch_id === user.branch_id);
  const projectIds = new Set(allowedProjects.map((project) => project.id));
  const phaseIds = new Set(store.phases.filter((phase) => projectIds.has(phase.project_id)).map((phase) => phase.id));
  const validations = store.validations.filter((validation) => phaseIds.has(validation.phase_id));

  const missingInfoFrequency = new Map<string, number>();
  validations.forEach((validation) => {
    validation.missing_information.forEach((item) => {
      missingInfoFrequency.set(item, (missingInfoFrequency.get(item) ?? 0) + 1);
    });
  });

  const average_groundedness_score =
    validations.length > 0 ? validations.reduce((total, validation) => total + validation.groundedness_score, 0) / validations.length : 0;

  return {
    validation_count: validations.length,
    warnings_count: validations.filter((validation) => validation.missing_information.length > 0 || validation.unsupported_claims.length > 0).length,
    required_human_review_count: validations.filter((validation) => validation.human_review_level === "required").length,
    do_not_proceed_count: validations.filter((validation) => validation.proceed_recommendation === "do_not_proceed").length,
    average_groundedness_score: Number(average_groundedness_score.toFixed(2)),
    top_missing_information: [...missingInfoFrequency.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([item]) => item),
    risk_distribution: {
      low: validations.filter((validation) => validation.human_review_level === "optional").length,
      medium: validations.filter((validation) => validation.human_review_level === "recommended").length,
      high: validations.filter((validation) => validation.human_review_level === "required").length
    }
  };
}
