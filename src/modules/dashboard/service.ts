import type { DashboardActivity, DashboardAlert, DashboardSummary, User, UserRole } from "@/types";
import { getStore } from "@/src/services/mock-store";

function allowedProjects(user: User) {
  const store = getStore();
  return user.role === "HQ" ? store.projects : store.projects.filter((project) => project.branch_id === user.branch_id);
}

export function getDashboardSummary(user: User): DashboardSummary {
  const store = getStore();
  const projects = allowedProjects(user);
  const projectIds = new Set(projects.map((project) => project.id));
  const approvals = store.approvals.filter((approval) => projectIds.has(approval.project_id));

  return {
    total_projects: projects.length,
    active_projects: projects.filter((project) => project.status === "active").length,
    validation_pending_projects: projects.filter((project) => project.status === "validation_pending").length,
    approval_pending_projects: projects.filter((project) => project.status === "approval_pending").length,
    executing_projects: projects.filter((project) => project.status === "executing").length,
    completed_projects: projects.filter((project) => project.status === "completed").length,
    approval_pending_count: approvals.filter((approval) => approval.status === "pending").length,
    approval_revise_count: approvals.filter((approval) => approval.status === "revise_requested").length
  };
}

export function getDashboardAlerts(user: User): DashboardAlert[] {
  const store = getStore();
  const projects = allowedProjects(user);
  const projectIds = new Set(projects.map((project) => project.id));

  return [
    ...store.validations
      .filter((validation) => validation.human_review_level === "required")
      .map((validation) => {
        const phase = store.phases.find((entry) => entry.id === validation.phase_id);
        return {
          id: `alert-validation-${validation.id}`,
          title: "Validation warning due to missing information",
          description: validation.missing_information.join(", ") || "Validation requires human review.",
          risk_level: "high" as const,
          project_id: phase?.project_id ?? null,
          phase_id: validation.phase_id,
          created_at: validation.validated_at
        };
      }),
    ...store.approvals
      .filter((approval) => approval.status === "pending" || approval.status === "escalated")
      .map((approval) => ({
        id: `alert-approval-${approval.id}`,
        title: approval.status === "escalated" ? "Urgent branch escalation" : "Approval request pending",
        description: approval.request_summary,
        risk_level: approval.risk_level,
        project_id: approval.project_id,
        phase_id: approval.phase_id,
        created_at: approval.decided_at ?? store.projects.find((project) => project.id === approval.project_id)?.updated_at ?? new Date().toISOString()
      }))
  ].filter((alert) => (alert.project_id ? projectIds.has(alert.project_id) : true));
}

export function getDashboardActivity(user: User): DashboardActivity[] {
  const store = getStore();
  const projects = allowedProjects(user);
  const projectIds = new Set(projects.map((project) => project.id));
  const resolveActorRole = (role?: UserRole): UserRole => role ?? "Branch Office";

  return [
    ...store.project_inputs.map((input) => ({
      id: `activity-input-${input.id}`,
      project_id: input.project_id,
      phase_id: null,
      message: `Input submitted from ${input.source_type}.`,
      actor_name: store.users.find((entry) => entry.id === input.uploaded_by)?.name ?? "Unknown",
      actor_role: resolveActorRole(store.users.find((entry) => entry.id === input.uploaded_by)?.role),
      project_status: input.project_id ? store.projects.find((entry) => entry.id === input.project_id)?.status ?? null : null,
      approval_status: input.project_id ? store.projects.find((entry) => entry.id === input.project_id)?.approval_status ?? null : null,
      created_at: input.created_at
    })),
    ...store.execution_updates.map((executionUpdate) => {
      const phase = store.phases.find((entry) => entry.id === executionUpdate.phase_id);
      const project = phase ? store.projects.find((entry) => entry.id === phase.project_id) : null;
      const userEntry = store.users.find((entry) => entry.id === executionUpdate.submitted_by);

      return {
        id: `activity-execution-${executionUpdate.id}`,
        project_id: project?.id ?? null,
        phase_id: executionUpdate.phase_id,
        message: `execution_update submitted with ${executionUpdate.success_level} result.`,
        actor_name: userEntry?.name ?? "Unknown",
        actor_role: resolveActorRole(userEntry?.role),
        project_status: project?.status ?? null,
        approval_status: project?.approval_status ?? null,
        created_at: executionUpdate.submitted_at
      };
    }),
    ...store.approvals.map((approval) => ({
      id: `activity-approval-${approval.id}`,
      project_id: approval.project_id,
      phase_id: approval.phase_id,
      message: `Approval request is ${approval.status}.`,
      actor_name: approval.decided_by ? store.users.find((entry) => entry.id === approval.decided_by)?.name ?? "HQ" : "Workflow system",
      actor_role: approval.decided_by ? ("HQ" as const) : ("Branch Office" as const),
      project_status: store.projects.find((entry) => entry.id === approval.project_id)?.status ?? null,
      approval_status: approval.status,
      created_at: approval.decided_at ?? store.projects.find((entry) => entry.id === approval.project_id)?.updated_at ?? new Date().toISOString()
    }))
  ]
    .filter((item) => (item.project_id ? projectIds.has(item.project_id) : true))
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 12);
}
