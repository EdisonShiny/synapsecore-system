import type {
  AI_MODULES,
  APPROVAL_DECISION_VALUES,
  HUMAN_REVIEW_LEVEL_VALUES,
  PRIORITY_VALUES,
  PROCEED_RECOMMENDATION_VALUES,
  RISK_LEVEL_VALUES,
  SUCCESS_LEVEL_VALUES,
  URGENCY_VALUES,
  USER_ROLES
} from "./constants";

export type AiModule = (typeof AI_MODULES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type Urgency = (typeof URGENCY_VALUES)[number];
export type Priority = (typeof PRIORITY_VALUES)[number];
export type RiskLevel = (typeof RISK_LEVEL_VALUES)[number];
export type HumanReviewLevel = (typeof HUMAN_REVIEW_LEVEL_VALUES)[number];
export type ProceedRecommendation = (typeof PROCEED_RECOMMENDATION_VALUES)[number];
export type SuccessLevel = (typeof SUCCESS_LEVEL_VALUES)[number];
export type ApprovalDecisionRecommendation = (typeof APPROVAL_DECISION_VALUES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface PromptContext {
  userRole: UserRole;
  currentProjectContext?: JsonValue;
  inputData: JsonValue;
}

export interface PromptPair {
  system: string;
  userTemplate: (context: PromptContext) => string;
}

export interface InputUnderstandingInner {
  issue_type: string;
  business_area: string;
  branch: string;
  urgency: Urgency;
  summary: string;
  risks: string[];
  opportunities: string[];
  missing_information: string[];
  confidence_score: number;
  suggest_project_creation: boolean;
}

export interface InputUnderstandingOutput {
  input_understanding: InputUnderstandingInner;
}

export interface ProjectIdentificationInner {
  should_create_project: boolean;
  project_title: string;
  project_summary: string;
  project_type: string;
  recommended_owner: UserRole;
  recommended_priority: Priority;
  recommended_initial_phase: string;
  supporting_reasons: string[];
}

export interface ProjectIdentificationOutput {
  project_identification: ProjectIdentificationInner;
}

export interface PhasePlanGenerationInner {
  phase_name: string;
  objective: string;
  rationale: string;
  action_steps: string[];
  responsible_party: UserRole;
  required_inputs: string[];
  expected_output: string;
  dependencies: string[];
  estimated_risk: RiskLevel;
  impact_if_successful: string;
  confidence_score: number;
}

export interface PhasePlanGenerationOutput {
  phase_plan_generation: PhasePlanGenerationInner;
}

export interface ValidationInner {
  groundedness_score: number;
  missing_information: string[];
  unsupported_claims: string[];
  contradiction_flags: string[];
  impact_analysis: string;
  mitigation_steps: string[];
  proceed_recommendation: ProceedRecommendation;
  human_review_level: HumanReviewLevel;
}

export interface ValidationOutput {
  validation: ValidationInner;
}

export interface OutcomeReviewInner {
  outcome_summary: string;
  success_level: SuccessLevel;
  unresolved_issues: string[];
  lessons_learned: string[];
  next_phase_required: boolean;
  next_phase_plan: PhasePlanGenerationInner | Record<string, never>;
  improvement_suggestions: string[];
}

export interface OutcomeReviewOutput {
  outcome_review: OutcomeReviewInner;
}

export interface ApprovalRecommendationInner {
  request_summary: string;
  decision_recommendation: ApprovalDecisionRecommendation;
  reason_for_recommendation: string;
  risk_level: RiskLevel;
  urgency_level: Urgency;
  confidence_score: number;
  required_human_checks: string[];
}

export interface ApprovalRecommendationOutput {
  approval_recommendation: ApprovalRecommendationInner;
}

export type AiOutput =
  | InputUnderstandingOutput
  | ProjectIdentificationOutput
  | PhasePlanGenerationOutput
  | ValidationOutput
  | OutcomeReviewOutput
  | ApprovalRecommendationOutput;

export interface ModuleSchema {
  root: AiModule;
  description: string;
  schema: JsonValue;
}

export interface ValidationResult<T = AiOutput> {
  valid: boolean;
  value?: T;
  errors: string[];
  confidenceBand?: "high" | "medium" | "low";
  requiresHumanReview: boolean;
}

export interface RetryInstruction {
  maxAttempts: number;
  repairSystemPrompt: string;
  repairUserPrompt: (params: {
    module: AiModule;
    invalidOutput: string;
    validationErrors: string[];
    requiredSchema: JsonValue;
  }) => string;
}
