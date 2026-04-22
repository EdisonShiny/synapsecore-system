export type SynapseEntity =
  | "project"
  | "phase"
  | "plan"
  | "validation"
  | "approval"
  | "execution_update"
  | "ai_analysis"
  | "branch"
  | "HQ";

export type UserRole = "HQ" | "Branch Office";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

export type ApprovalState = "pending" | "approved" | "rejected" | "revise_requested" | "escalated";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PhaseStatus = "pending" | "planned" | "validating" | "approved" | "executing" | "completed" | "blocked";

export type ProjectStatus = "draft" | "active" | "validation_pending" | "approval_pending" | "executing" | "completed" | "escalated";

export type Priority = "low" | "medium" | "high" | "critical";

export type RiskLevel = "low" | "medium" | "high";

export type ValidationRecommendation = "proceed" | "proceed_with_caution" | "human_review_required" | "do_not_proceed";

export interface Project {
  id: string;
  title: string;
  branch: string;
  status: ProjectStatus;
  validation: ValidationRecommendation;
  approval: ApprovalState;
  priority: Priority;
}

export interface DashboardSummary {
  totalProjects: number;
  pendingApprovals: number;
  validationAlerts: number;
  executionHealth: number;
}
