import { MODULE_ENDPOINTS } from "./constants";
import type { AiModule } from "./types";

export interface AiPipelineStep {
  order: number;
  module: AiModule;
  endpoint: (typeof MODULE_ENDPOINTS)[AiModule];
  stage: string;
  purpose: string;
  fallback: string;
}

export const AI_PIPELINE: AiPipelineStep[] = [
  {
    order: 1,
    module: "input_understanding",
    endpoint: MODULE_ENDPOINTS.input_understanding,
    stage: "Normalize input and detect issue",
    purpose: "Convert raw branch or HQ input into structured ai_analysis.",
    fallback: "Use matching MOCK_INPUT_UNDERSTANDING scenario."
  },
  {
    order: 2,
    module: "project_identification",
    endpoint: MODULE_ENDPOINTS.project_identification,
    stage: "Determine project creation",
    purpose: "Decide whether a project should be created and suggest initial project fields.",
    fallback: "Use matching MOCK_PROJECT_IDENTIFICATION scenario."
  },
  {
    order: 3,
    module: "phase_plan_generation",
    endpoint: MODULE_ENDPOINTS.phase_plan_generation,
    stage: "Generate current phase plan",
    purpose: "Create one phase plan from project, ai_analysis, and available evidence.",
    fallback: "Use matching MOCK_PHASE_PLAN_GENERATION scenario."
  },
  {
    order: 4,
    module: "validation",
    endpoint: MODULE_ENDPOINTS.validation,
    stage: "Validate groundedness",
    purpose: "Flag missing information, unsupported claims, contradictions, and human review need.",
    fallback: "Use MOCK_VALIDATION.missing_information_warning for risky or incomplete demo data."
  },
  {
    order: 5,
    module: "approval_recommendation",
    endpoint: MODULE_ENDPOINTS.approval_recommendation,
    stage: "Recommend approval decision",
    purpose: "Recommend approved, rejected, revise_requested, or escalated for HQ.",
    fallback: "Use matching MOCK_APPROVAL_RECOMMENDATION scenario."
  },
  {
    order: 6,
    module: "outcome_review",
    endpoint: MODULE_ENDPOINTS.outcome_review,
    stage: "Review execution_update and improve",
    purpose: "Review execution outcome and propose next phase when needed.",
    fallback: "Use matching MOCK_OUTCOME_REVIEW scenario."
  }
];
