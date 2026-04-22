import { seedData } from "@/mocks/synapse-data";
import type { DashboardActivity, DashboardAlert, DashboardSummary } from "@/types";

const projectIds = new Set(seedData.projects.map((project) => project.id));

export const mockDashboardSummary: DashboardSummary = {
  total_projects: seedData.projects.length,
  active_projects: seedData.projects.filter((project) => project.status === "active").length,
  validation_pending_projects: seedData.projects.filter(
    (project) => project.status === "validation_pending",
  ).length,
  approval_pending_projects: seedData.projects.filter(
    (project) => project.status === "approval_pending",
  ).length,
  executing_projects: seedData.projects.filter((project) => project.status === "executing").length,
  completed_projects: seedData.projects.filter((project) => project.status === "completed").length,
  approval_pending_count: seedData.approvals.filter((approval) => approval.status === "pending")
    .length,
  approval_revise_count: seedData.approvals.filter(
    (approval) => approval.status === "revise_requested",
  ).length,
};

export const mockDashboardAlerts: DashboardAlert[] = [
  ...seedData.validations
    .filter((validation) => validation.human_review_level === "required")
    .map((validation) => {
      const phase = seedData.phases.find((entry) => entry.id === validation.phase_id);

      return {
        id: `alert-validation-${validation.id}`,
        title: "Validation warning due to missing information",
        description: validation.missing_information.join(", ") || validation.impact_analysis,
        risk_level: "high" as const,
        project_id: phase?.project_id ?? null,
        phase_id: validation.phase_id,
        created_at: validation.validated_at,
      };
    }),
  ...seedData.approvals
    .filter((approval) => approval.status === "pending" || approval.status === "escalated")
    .map((approval) => ({
      id: `alert-approval-${approval.id}`,
      title: approval.status === "escalated" ? "Urgent branch escalation" : "Approval request pending",
      description: approval.request_summary,
      risk_level: approval.risk_level,
      project_id: approval.project_id,
      phase_id: approval.phase_id,
      created_at:
        approval.decided_at ??
        seedData.projects.find((project) => project.id === approval.project_id)?.updated_at ??
        new Date().toISOString(),
    })),
].filter((alert) => (alert.project_id ? projectIds.has(alert.project_id) : true));

export const mockDashboardActivity: DashboardActivity[] = [
  ...seedData.project_inputs.map((input) => ({
    id: `activity-input-${input.id}`,
    project_id: input.project_id,
    phase_id: null,
    message: `Input submitted from ${input.source_type}.`,
    actor_name: seedData.users.find((entry) => entry.id === input.uploaded_by)?.name ?? "Unknown",
    actor_role:
      seedData.users.find((entry) => entry.id === input.uploaded_by)?.role ?? "Branch Office",
    project_status: input.project_id
      ? seedData.projects.find((entry) => entry.id === input.project_id)?.status ?? null
      : null,
    approval_status: input.project_id
      ? seedData.projects.find((entry) => entry.id === input.project_id)?.approval_status ?? null
      : null,
    created_at: input.created_at,
  })),
  ...seedData.approvals.map((approval) => ({
    id: `activity-approval-${approval.id}`,
    project_id: approval.project_id,
    phase_id: approval.phase_id,
    message: `Approval request is ${approval.status}.`,
    actor_name: approval.decided_by
      ? seedData.users.find((entry) => entry.id === approval.decided_by)?.name ?? "HQ"
      : "Workflow system",
    actor_role: approval.decided_by ? ("HQ" as const) : ("Branch Office" as const),
    project_status:
      seedData.projects.find((entry) => entry.id === approval.project_id)?.status ?? null,
    approval_status: approval.status,
    created_at:
      approval.decided_at ??
      seedData.projects.find((entry) => entry.id === approval.project_id)?.updated_at ??
      new Date().toISOString(),
  })),
]
  .sort((left, right) => right.created_at.localeCompare(left.created_at))
  .slice(0, 12);
