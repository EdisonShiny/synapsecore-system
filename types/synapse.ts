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

export type ApprovalState = "pending" | "approved" | "rejected" | "needs_validation";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PhaseStatus = "planned" | "active" | "validated" | "executed" | "improving";
