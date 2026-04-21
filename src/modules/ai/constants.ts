export const AI_MODULES = [
  "input_understanding",
  "project_identification",
  "phase_plan_generation",
  "validation",
  "outcome_review",
  "approval_recommendation"
] as const;

export const USER_ROLES = ["HQ", "Branch Office"] as const;

export const URGENCY_VALUES = ["low", "medium", "high", "critical"] as const;
export const PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const;
export const RISK_LEVEL_VALUES = ["low", "medium", "high"] as const;
export const HUMAN_REVIEW_LEVEL_VALUES = ["optional", "recommended", "required"] as const;
export const PROCEED_RECOMMENDATION_VALUES = [
  "proceed",
  "proceed_with_caution",
  "human_review_required",
  "do_not_proceed"
] as const;
export const SUCCESS_LEVEL_VALUES = ["low", "partial", "successful", "failed"] as const;
export const APPROVAL_DECISION_VALUES = [
  "approved",
  "rejected",
  "revise_requested",
  "escalated"
] as const;

export const RESPONSIBLE_PARTY_VALUES = USER_ROLES;

export const MODULE_ENDPOINTS = {
  input_understanding: "/ai/analyze-input",
  project_identification: "/ai/create-project-from-input",
  phase_plan_generation: "/ai/generate-phase-plan",
  validation: "/ai/validate-phase-plan",
  outcome_review: "/ai/review-outcome",
  approval_recommendation: "/ai/recommend-approval"
} as const;

export const CONFIDENCE = {
  highMinimum: 80,
  mediumMinimum: 50,
  lowMaximum: 49
} as const;
