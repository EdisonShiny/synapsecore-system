export type IsoDateString = string;

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

export type BranchStatus = "active" | "inactive";

export type ProjectStatus =
  | "draft"
  | "active"
  | "validation_pending"
  | "approval_pending"
  | "executing"
  | "completed"
  | "escalated";

export type PhaseStatus =
  | "pending"
  | "planned"
  | "validating"
  | "approved"
  | "executing"
  | "completed"
  | "blocked";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revise_requested" | "escalated";

export type Urgency = "low" | "medium" | "high" | "critical";

export type Priority = "low" | "medium" | "high" | "critical";

export type RiskLevel = "low" | "medium" | "high";

export type HumanReviewLevel = "optional" | "recommended" | "required";

export type ProceedRecommendation = "proceed" | "proceed_with_caution" | "human_review_required" | "do_not_proceed";

export type SuccessLevel = "low" | "partial" | "successful" | "failed";

export type SourceType = "manual_form" | "branch_report" | "market_news" | "feedback" | "uploaded_document" | "outcome_update";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

export type ConfidenceLevel = "high" | "medium" | "low";
