import type { AiModule, ModuleSchema } from "./types";

const stringArraySchema = {
  type: "array",
  items: { type: "string" },
  additionalItems: false
} as const;

const confidenceSchema = {
  type: "number",
  minimum: 0,
  maximum: 100
} as const;

export const inputUnderstandingSchema = {
  type: "object",
  required: ["input_understanding"],
  additionalProperties: false,
  properties: {
    input_understanding: {
      type: "object",
      required: [
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
      additionalProperties: false,
      properties: {
        issue_type: { type: "string" },
        business_area: { type: "string" },
        branch: { type: "string" },
        urgency: { enum: ["low", "medium", "high", "critical"] },
        summary: { type: "string" },
        risks: stringArraySchema,
        opportunities: stringArraySchema,
        missing_information: stringArraySchema,
        confidence_score: confidenceSchema,
        suggest_project_creation: { type: "boolean" }
      }
    }
  }
} as const;

export const projectIdentificationSchema = {
  type: "object",
  required: ["project_identification"],
  additionalProperties: false,
  properties: {
    project_identification: {
      type: "object",
      required: [
        "should_create_project",
        "project_title",
        "project_summary",
        "project_type",
        "recommended_owner",
        "recommended_priority",
        "recommended_initial_phase",
        "supporting_reasons"
      ],
      additionalProperties: false,
      properties: {
        should_create_project: { type: "boolean" },
        project_title: { type: "string" },
        project_summary: { type: "string" },
        project_type: { type: "string" },
        recommended_owner: { enum: ["HQ", "Branch Office"] },
        recommended_priority: { enum: ["low", "medium", "high", "critical"] },
        recommended_initial_phase: { type: "string" },
        supporting_reasons: stringArraySchema
      }
    }
  }
} as const;

export const phasePlanGenerationInnerSchema = {
  type: "object",
  required: [
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
  additionalProperties: false,
  properties: {
    phase_name: { type: "string" },
    objective: { type: "string" },
    rationale: { type: "string" },
    action_steps: stringArraySchema,
    responsible_party: { enum: ["HQ", "Branch Office"] },
    required_inputs: stringArraySchema,
    expected_output: { type: "string" },
    dependencies: stringArraySchema,
    estimated_risk: { enum: ["low", "medium", "high"] },
    impact_if_successful: { type: "string" },
    confidence_score: confidenceSchema
  }
} as const;

export const phasePlanGenerationSchema = {
  type: "object",
  required: ["phase_plan_generation"],
  additionalProperties: false,
  properties: {
    phase_plan_generation: phasePlanGenerationInnerSchema
  }
} as const;

export const validationSchema = {
  type: "object",
  required: ["validation"],
  additionalProperties: false,
  properties: {
    validation: {
      type: "object",
      required: [
        "groundedness_score",
        "missing_information",
        "unsupported_claims",
        "contradiction_flags",
        "impact_analysis",
        "mitigation_steps",
        "proceed_recommendation",
        "human_review_level"
      ],
      additionalProperties: false,
      properties: {
        groundedness_score: confidenceSchema,
        missing_information: stringArraySchema,
        unsupported_claims: stringArraySchema,
        contradiction_flags: stringArraySchema,
        impact_analysis: { type: "string" },
        mitigation_steps: stringArraySchema,
        proceed_recommendation: {
          enum: [
            "proceed",
            "proceed_with_caution",
            "human_review_required",
            "do_not_proceed"
          ]
        },
        human_review_level: { enum: ["optional", "recommended", "required"] }
      }
    }
  }
} as const;

export const outcomeReviewSchema = {
  type: "object",
  required: ["outcome_review"],
  additionalProperties: false,
  properties: {
    outcome_review: {
      type: "object",
      required: [
        "outcome_summary",
        "success_level",
        "unresolved_issues",
        "lessons_learned",
        "next_phase_required",
        "next_phase_plan",
        "improvement_suggestions"
      ],
      additionalProperties: false,
      properties: {
        outcome_summary: { type: "string" },
        success_level: { enum: ["low", "partial", "successful", "failed"] },
        unresolved_issues: stringArraySchema,
        lessons_learned: stringArraySchema,
        next_phase_required: { type: "boolean" },
        next_phase_plan: {
          oneOf: [
            phasePlanGenerationInnerSchema,
            {
              type: "object",
              additionalProperties: false
            }
          ]
        },
        improvement_suggestions: stringArraySchema
      }
    }
  }
} as const;

export const approvalRecommendationSchema = {
  type: "object",
  required: ["approval_recommendation"],
  additionalProperties: false,
  properties: {
    approval_recommendation: {
      type: "object",
      required: [
        "request_summary",
        "decision_recommendation",
        "reason_for_recommendation",
        "risk_level",
        "urgency_level",
        "confidence_score",
        "required_human_checks"
      ],
      additionalProperties: false,
      properties: {
        request_summary: { type: "string" },
        decision_recommendation: {
          enum: ["approved", "rejected", "revise_requested", "escalated"]
        },
        reason_for_recommendation: { type: "string" },
        risk_level: { enum: ["low", "medium", "high"] },
        urgency_level: { enum: ["low", "medium", "high", "critical"] },
        confidence_score: confidenceSchema,
        required_human_checks: stringArraySchema
      }
    }
  }
} as const;

export const AI_SCHEMAS = {
  input_understanding: {
    root: "input_understanding",
    description: "Convert raw business input into structured ai_analysis fields.",
    schema: inputUnderstandingSchema
  },
  project_identification: {
    root: "project_identification",
    description: "Decide whether a formal project should be created.",
    schema: projectIdentificationSchema
  },
  phase_plan_generation: {
    root: "phase_plan_generation",
    description: "Generate the current phase plan.",
    schema: phasePlanGenerationSchema
  },
  validation: {
    root: "validation",
    description: "Check groundedness, missing information, contradictions, and execution risk.",
    schema: validationSchema
  },
  outcome_review: {
    root: "outcome_review",
    description: "Review execution_update and propose whether another phase is needed.",
    schema: outcomeReviewSchema
  },
  approval_recommendation: {
    root: "approval_recommendation",
    description: "Recommend how HQ should decide an approval request.",
    schema: approvalRecommendationSchema
  }
} satisfies Record<AiModule, ModuleSchema>;

export function getSchema(module: AiModule): ModuleSchema {
  return AI_SCHEMAS[module];
}
