import {
  AI_MODULES,
  APPROVAL_DECISION_VALUES,
  CONFIDENCE,
  HUMAN_REVIEW_LEVEL_VALUES,
  PRIORITY_VALUES,
  PROCEED_RECOMMENDATION_VALUES,
  RISK_LEVEL_VALUES,
  SUCCESS_LEVEL_VALUES,
  URGENCY_VALUES,
  USER_ROLES
} from "./constants";
import { getSchema } from "./schemas";
import type {
  AiModule,
  AiOutput,
  InputUnderstandingInner,
  RetryInstruction,
  ValidationResult
} from "./types";

const moduleSet = new Set<string>(AI_MODULES);
const userRoleSet = new Set<string>(USER_ROLES);
const urgencySet = new Set<string>(URGENCY_VALUES);
const prioritySet = new Set<string>(PRIORITY_VALUES);
const riskSet = new Set<string>(RISK_LEVEL_VALUES);
const reviewLevelSet = new Set<string>(HUMAN_REVIEW_LEVEL_VALUES);
const proceedSet = new Set<string>(PROCEED_RECOMMENDATION_VALUES);
const successSet = new Set<string>(SUCCESS_LEVEL_VALUES);
const approvalDecisionSet = new Set<string>(APPROVAL_DECISION_VALUES);

export function parseStrictJson(raw: string): { value?: unknown; errors: string[] } {
  const trimmed = raw.trim();
  const errors: string[] = [];

  if (trimmed.startsWith("```") || trimmed.endsWith("```")) {
    errors.push("Output contains markdown code fences.");
  }

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    errors.push("Output must be a single JSON object.");
  }

  try {
    return {
      value: JSON.parse(trimmed),
      errors
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid JSON.");
    return { errors };
  }
}

export function validateAiOutput(raw: string, expectedModule: AiModule): ValidationResult {
  const parsed = parseStrictJson(raw);
  const errors = [...parsed.errors];

  if (parsed.value === undefined) {
    return { valid: false, errors, requiresHumanReview: true };
  }

  if (!isRecord(parsed.value)) {
    return {
      valid: false,
      errors: [...errors, "Output root must be an object."],
      requiresHumanReview: true
    };
  }

  const rootKeys = Object.keys(parsed.value);
  if (rootKeys.length !== 1 || rootKeys[0] !== expectedModule) {
    errors.push(`Output root key must be exactly "${expectedModule}".`);
  }

  for (const key of rootKeys) {
    if (!moduleSet.has(key)) {
      errors.push(`Unknown AI module root key "${key}".`);
    }
  }

  const inner = parsed.value[expectedModule];
  if (!isRecord(inner)) {
    errors.push(`"${expectedModule}" must be an object.`);
    return { valid: false, errors, requiresHumanReview: true };
  }

  validateByModule(expectedModule, inner, errors);

  const confidence = readConfidence(expectedModule, inner);
  const confidenceBand = confidenceToBand(confidence);
  const requiresHumanReview = shouldRequireHumanReview(expectedModule, inner, confidence, errors);

  return {
    valid: errors.length === 0,
    value: errors.length === 0 ? (parsed.value as AiOutput) : undefined,
    errors,
    confidenceBand,
    requiresHumanReview
  };
}

export function confidenceToBand(confidence: number | undefined): "high" | "medium" | "low" | undefined {
  if (confidence === undefined) return undefined;
  if (confidence >= CONFIDENCE.highMinimum) return "high";
  if (confidence >= CONFIDENCE.mediumMinimum) return "medium";
  return "low";
}

export function scoreInputUnderstanding(input: {
  hasBranch: boolean;
  hasIssue: boolean;
  hasEvidence: boolean;
  hasRequestedAction: boolean;
  hasContradiction: boolean;
}): number {
  let score = 40;
  if (input.hasBranch) score += 15;
  if (input.hasIssue) score += 15;
  if (input.hasEvidence) score += 15;
  if (input.hasRequestedAction) score += 10;
  if (input.hasContradiction) score -= 25;
  return clampScore(score);
}

export function scoreValidationGroundedness(input: {
  totalClaims: number;
  supportedClaims: number;
  missingCriticalInformation: number;
  contradictionCount: number;
}): number {
  if (input.totalClaims <= 0) return 0;
  const supportScore = (input.supportedClaims / input.totalClaims) * 100;
  const missingPenalty = input.missingCriticalInformation * 12;
  const contradictionPenalty = input.contradictionCount * 20;
  return clampScore(supportScore - missingPenalty - contradictionPenalty);
}

export const RETRY_STRATEGY: RetryInstruction = {
  maxAttempts: 2,
  repairSystemPrompt: [
    `You repair invalid AI module output for SynapseCore System.`,
    `Return strict JSON only.`,
    `Do not add new facts.`,
    `Do not include markdown, comments, or prose.`,
    `Keep the required root key and schema exactly.`
  ].join("\n"),
  repairUserPrompt: ({ module, invalidOutput, validationErrors, requiredSchema }) =>
    [
      `Repair this invalid output for module "${module}".`,
      `Validation errors: ${JSON.stringify(validationErrors)}`,
      `Required schema: ${JSON.stringify(requiredSchema, null, 2)}`,
      `Invalid output:`,
      invalidOutput,
      `Return only the corrected JSON object with root key "${module}".`
    ].join("\n")
};

export function getRetrySchema(module: AiModule) {
  return getSchema(module).schema;
}

function validateByModule(module: AiModule, value: Record<string, unknown>, errors: string[]): void {
  switch (module) {
    case "input_understanding":
      requireKeys(
        value,
        [
          "issue_type",
          "business_area",
          "branch",
          "urgency",
          "summary",
          "risks",
          "opportunities",
          "missing_information",
          "confidence_score",
          "suggest_project_creation"
        ],
        errors
      );
      requireString(value, "issue_type", errors);
      requireString(value, "business_area", errors);
      requireString(value, "branch", errors);
      requireEnum(value, "urgency", urgencySet, errors);
      requireString(value, "summary", errors);
      requireStringArray(value, "risks", errors);
      requireStringArray(value, "opportunities", errors);
      requireStringArray(value, "missing_information", errors);
      requireScore(value, "confidence_score", errors);
      requireBoolean(value, "suggest_project_creation", errors);
      break;
    case "project_identification":
      requireKeys(
        value,
        [
          "should_create_project",
          "project_title",
          "project_summary",
          "project_type",
          "recommended_owner",
          "recommended_priority",
          "recommended_initial_phase",
          "supporting_reasons"
        ],
        errors
      );
      requireBoolean(value, "should_create_project", errors);
      requireString(value, "project_title", errors);
      requireString(value, "project_summary", errors);
      requireString(value, "project_type", errors);
      requireEnum(value, "recommended_owner", userRoleSet, errors);
      requireEnum(value, "recommended_priority", prioritySet, errors);
      requireString(value, "recommended_initial_phase", errors);
      requireStringArray(value, "supporting_reasons", errors);
      break;
    case "phase_plan_generation":
      validatePhasePlanInner(value, errors, "phase_plan_generation");
      break;
    case "validation":
      requireKeys(
        value,
        [
          "groundedness_score",
          "missing_information",
          "unsupported_claims",
          "contradiction_flags",
          "impact_analysis",
          "mitigation_steps",
          "proceed_recommendation",
          "human_review_level"
        ],
        errors
      );
      requireScore(value, "groundedness_score", errors);
      requireStringArray(value, "missing_information", errors);
      requireStringArray(value, "unsupported_claims", errors);
      requireStringArray(value, "contradiction_flags", errors);
      requireString(value, "impact_analysis", errors);
      requireStringArray(value, "mitigation_steps", errors);
      requireEnum(value, "proceed_recommendation", proceedSet, errors);
      requireEnum(value, "human_review_level", reviewLevelSet, errors);
      break;
    case "outcome_review":
      requireKeys(
        value,
        [
          "outcome_summary",
          "success_level",
          "unresolved_issues",
          "lessons_learned",
          "next_phase_required",
          "next_phase_plan",
          "improvement_suggestions"
        ],
        errors
      );
      requireString(value, "outcome_summary", errors);
      requireEnum(value, "success_level", successSet, errors);
      requireStringArray(value, "unresolved_issues", errors);
      requireStringArray(value, "lessons_learned", errors);
      requireBoolean(value, "next_phase_required", errors);
      requireStringArray(value, "improvement_suggestions", errors);
      if (value.next_phase_required === true) {
        if (!isRecord(value.next_phase_plan)) {
          errors.push("next_phase_plan must be an object when next_phase_required is true.");
        } else {
          validatePhasePlanInner(value.next_phase_plan, errors, "next_phase_plan");
        }
      }
      break;
    case "approval_recommendation":
      requireKeys(
        value,
        [
          "request_summary",
          "decision_recommendation",
          "reason_for_recommendation",
          "risk_level",
          "urgency_level",
          "confidence_score",
          "required_human_checks"
        ],
        errors
      );
      requireString(value, "request_summary", errors);
      requireEnum(value, "decision_recommendation", approvalDecisionSet, errors);
      requireString(value, "reason_for_recommendation", errors);
      requireEnum(value, "risk_level", riskSet, errors);
      requireEnum(value, "urgency_level", urgencySet, errors);
      requireScore(value, "confidence_score", errors);
      requireStringArray(value, "required_human_checks", errors);
      break;
  }
}

function validatePhasePlanInner(value: Record<string, unknown>, errors: string[], label: string): void {
  requireKeys(
    value,
    [
      "phase_name",
      "objective",
      "rationale",
      "action_steps",
      "responsible_party",
      "required_inputs",
      "expected_output",
      "dependencies",
      "estimated_risk",
      "impact_if_successful",
      "confidence_score"
    ],
    errors
  );
  requireString(value, "phase_name", errors, label);
  requireString(value, "objective", errors, label);
  requireString(value, "rationale", errors, label);
  requireStringArray(value, "action_steps", errors, label);
  requireEnum(value, "responsible_party", userRoleSet, errors, label);
  requireStringArray(value, "required_inputs", errors, label);
  requireString(value, "expected_output", errors, label);
  requireStringArray(value, "dependencies", errors, label);
  requireEnum(value, "estimated_risk", riskSet, errors, label);
  requireString(value, "impact_if_successful", errors, label);
  requireScore(value, "confidence_score", errors, label);
}

function shouldRequireHumanReview(
  module: AiModule,
  value: Record<string, unknown>,
  confidence: number | undefined,
  errors: string[]
): boolean {
  if (errors.length > 0) return true;
  if (confidence !== undefined && confidence < CONFIDENCE.mediumMinimum) return true;

  if (module === "validation") {
    const groundedness = typeof value.groundedness_score === "number" ? value.groundedness_score : 0;
    return (
      groundedness < 70 ||
      value.human_review_level === "required" ||
      value.proceed_recommendation === "human_review_required" ||
      value.proceed_recommendation === "do_not_proceed"
    );
  }

  if (module === "approval_recommendation") {
    return value.decision_recommendation !== "approved" || value.risk_level === "high";
  }

  if (module === "phase_plan_generation") {
    return value.estimated_risk === "high";
  }

  if (module === "outcome_review") {
    const unresolvedIssues = Array.isArray(value.unresolved_issues) ? value.unresolved_issues.length : 0;
    return value.success_level !== "successful" || unresolvedIssues > 0;
  }

  if (module === "input_understanding") {
    const input = value as unknown as InputUnderstandingInner;
    return input.urgency === "critical" || input.missing_information.length > 0;
  }

  return false;
}

function readConfidence(module: AiModule, value: Record<string, unknown>): number | undefined {
  if (module === "validation") {
    return typeof value.groundedness_score === "number" ? value.groundedness_score : undefined;
  }
  return typeof value.confidence_score === "number" ? value.confidence_score : undefined;
}

function requireKeys(value: Record<string, unknown>, keys: string[], errors: string[]): void {
  const allowed = new Set(keys);
  for (const key of keys) {
    if (!(key in value)) errors.push(`Missing required field "${key}".`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`Unexpected field "${key}".`);
  }
}

function requireString(value: Record<string, unknown>, key: string, errors: string[], label?: string): void {
  if (typeof value[key] !== "string") errors.push(`${prefix(label)}${key} must be a string.`);
}

function requireBoolean(value: Record<string, unknown>, key: string, errors: string[]): void {
  if (typeof value[key] !== "boolean") errors.push(`${key} must be a boolean.`);
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string,
  errors: string[],
  label?: string
): void {
  if (!Array.isArray(value[key]) || !(value[key] as unknown[]).every((item) => typeof item === "string")) {
    errors.push(`${prefix(label)}${key} must be an array of strings.`);
  }
}

function requireEnum(
  value: Record<string, unknown>,
  key: string,
  allowed: Set<string>,
  errors: string[],
  label?: string
): void {
  if (typeof value[key] !== "string" || !allowed.has(value[key] as string)) {
    errors.push(`${prefix(label)}${key} has an unsupported value.`);
  }
}

function requireScore(value: Record<string, unknown>, key: string, errors: string[], label?: string): void {
  if (typeof value[key] !== "number" || value[key] < 0 || value[key] > 100) {
    errors.push(`${prefix(label)}${key} must be a number from 0 to 100.`);
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prefix(label?: string): string {
  return label ? `${label}.` : "";
}
