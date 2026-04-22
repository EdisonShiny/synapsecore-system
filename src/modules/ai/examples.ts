import type {
  ApprovalRecommendationOutput,
  InputUnderstandingOutput,
  OutcomeReviewOutput,
  PhasePlanGenerationOutput,
  PromptContext,
  ProjectIdentificationOutput,
  ValidationOutput
} from "./types";

export const EXAMPLE_INPUT_UNDERSTANDING_REQUEST = {
  userRole: "Branch Office",
  inputData: {
    source_type: "manual_form",
    raw_text:
      "Kuala Lumpur Central Branch is running low on Product A. Customers asked for it more often this week and staff expect stockout before next replenishment. Need guidance."
  }
} satisfies PromptContext;

export const EXAMPLE_INPUT_UNDERSTANDING_RESPONSE: InputUnderstandingOutput = {
  input_understanding: {
    issue_type: "low stock with rising demand",
    business_area: "inventory",
    branch: "Kuala Lumpur Central Branch",
    urgency: "high",
    summary:
      "Branch reports low stock for Product A with increased customer demand and possible stockout before the next replenishment.",
    risks: [
      "Potential stockout before next replenishment.",
      "Lost sales if customer demand cannot be fulfilled."
    ],
    opportunities: [
      "Restock or stock transfer can reduce stockout risk.",
      "Demand signal can improve replenishment planning."
    ],
    missing_information: [
      "Current stock quantity",
      "Recent sales rate",
      "Next replenishment date"
    ],
    confidence_score: 84,
    suggest_project_creation: true
  }
};

export const EXAMPLE_PROJECT_IDENTIFICATION_REQUEST = {
  userRole: "Branch Office",
  inputData: {
    project_input: EXAMPLE_INPUT_UNDERSTANDING_REQUEST.inputData,
    ai_analysis: EXAMPLE_INPUT_UNDERSTANDING_RESPONSE.input_understanding
  }
} satisfies PromptContext;

export const EXAMPLE_PROJECT_IDENTIFICATION_RESPONSE: ProjectIdentificationOutput = {
  project_identification: {
    should_create_project: true,
    project_title: "Product A Low Stock Response",
    project_summary:
      "Coordinate branch stock verification and restock approval for Product A due to low stock and rising demand.",
    project_type: "inventory_response",
    recommended_owner: "Branch Office",
    recommended_priority: "high",
    recommended_initial_phase: "Confirm demand and stock gap",
    supporting_reasons: [
      "Branch reports low stock.",
      "Branch reports increased customer demand.",
      "Restock or stock transfer may require approval."
    ]
  }
};

export const EXAMPLE_PHASE_PLAN_GENERATION_REQUEST = {
  userRole: "Branch Office",
  currentProjectContext: {
    project: {
      title: "Product A Low Stock Response",
      summary:
        "Coordinate branch stock verification and restock approval for Product A due to low stock and rising demand.",
      priority: "high",
      status: "active",
      approval_status: "pending"
    }
  },
  inputData: {
    ai_analysis: EXAMPLE_INPUT_UNDERSTANDING_RESPONSE.input_understanding,
    project_identification: EXAMPLE_PROJECT_IDENTIFICATION_RESPONSE.project_identification
  }
} satisfies PromptContext;

export const EXAMPLE_PHASE_PLAN_GENERATION_RESPONSE: PhasePlanGenerationOutput = {
  phase_plan_generation: {
    phase_name: "Confirm demand and stock gap",
    objective:
      "Verify current Product A stock, recent demand, and replenishment need before approval.",
    rationale:
      "The branch reports low stock and rising demand, but exact stock and sales figures are missing.",
    action_steps: [
      "Check current Product A stock quantity.",
      "Review recent sales or customer request count.",
      "Compare current stock against expected demand until next replenishment.",
      "Prepare restock or transfer request if gap is confirmed."
    ],
    responsible_party: "Branch Office",
    required_inputs: [
      "Current stock quantity",
      "Recent sales or request count",
      "Next replenishment date",
      "Requested restock or transfer quantity"
    ],
    expected_output: "Verified stock gap summary and approval-ready restock request.",
    dependencies: [
      "Branch inventory records",
      "Recent sales report",
      "HQ stock availability"
    ],
    estimated_risk: "medium",
    impact_if_successful:
      "Branch can reduce stockout risk and support customer demand with grounded evidence.",
    confidence_score: 79
  }
};

export const EXAMPLE_VALIDATION_REQUEST = {
  userRole: "HQ",
  currentProjectContext: EXAMPLE_PHASE_PLAN_GENERATION_REQUEST.currentProjectContext,
  inputData: {
    ai_analysis: EXAMPLE_INPUT_UNDERSTANDING_RESPONSE.input_understanding,
    phase_plan: EXAMPLE_PHASE_PLAN_GENERATION_RESPONSE.phase_plan_generation
  }
} satisfies PromptContext;

export const EXAMPLE_VALIDATION_RESPONSE: ValidationOutput = {
  validation: {
    groundedness_score: 66,
    missing_information: [
      "Current stock quantity",
      "Recent sales or request count",
      "Requested restock quantity"
    ],
    unsupported_claims: [],
    contradiction_flags: [],
    impact_analysis:
      "The plan is directionally grounded, but approval should wait until missing stock and demand evidence is collected.",
    mitigation_steps: [
      "Require inventory record before approval request.",
      "Require recent sales or customer request count.",
      "Ask HQ to verify available stock before final approval."
    ],
    proceed_recommendation: "human_review_required",
    human_review_level: "required"
  }
};

export const EXAMPLE_APPROVAL_RECOMMENDATION_REQUEST = {
  userRole: "HQ",
  currentProjectContext: EXAMPLE_PHASE_PLAN_GENERATION_REQUEST.currentProjectContext,
  inputData: {
    approval: {
      request_type: "restock",
      request_summary:
        "Branch requests restock approval for Product A due to low stock and rising demand.",
      status: "pending"
    },
    validation: EXAMPLE_VALIDATION_RESPONSE.validation
  }
} satisfies PromptContext;

export const EXAMPLE_APPROVAL_RECOMMENDATION_RESPONSE: ApprovalRecommendationOutput = {
  approval_recommendation: {
    request_summary:
      "Branch requests restock approval for Product A due to low stock and rising demand.",
    decision_recommendation: "revise_requested",
    reason_for_recommendation:
      "The request is plausible but missing stock quantity, demand evidence, and requested restock quantity.",
    risk_level: "medium",
    urgency_level: "high",
    confidence_score: 72,
    required_human_checks: [
      "Confirm current stock quantity.",
      "Confirm recent demand evidence.",
      "Confirm requested restock quantity and HQ stock availability."
    ]
  }
};

export const EXAMPLE_OUTCOME_REVIEW_REQUEST = {
  userRole: "Branch Office",
  currentProjectContext: EXAMPLE_PHASE_PLAN_GENERATION_REQUEST.currentProjectContext,
  inputData: {
    phase_plan: EXAMPLE_PHASE_PLAN_GENERATION_RESPONSE.phase_plan_generation,
    execution_update: {
      outcome_summary:
        "Branch verified current stock and recent demand, then prepared a restock request.",
      evidence_text:
        "Inventory record and recent customer request count were checked by branch staff.",
      success_level: "successful",
      unresolved_issues: ["HQ approval is still required before restock action."]
    }
  }
} satisfies PromptContext;

export const EXAMPLE_OUTCOME_REVIEW_RESPONSE: OutcomeReviewOutput = {
  outcome_review: {
    outcome_summary:
      "Branch verified current stock and recent demand, then prepared a restock request for HQ approval.",
    success_level: "successful",
    unresolved_issues: ["HQ has not decided the restock approval request."],
    lessons_learned: [
      "Stock and demand evidence should be gathered before approval.",
      "Requested restock quantity should be included with branch escalation."
    ],
    next_phase_required: true,
    next_phase_plan: {
      phase_name: "Request HQ restock approval",
      objective:
        "Submit verified stock gap evidence and requested restock quantity for HQ decision.",
      rationale:
        "The branch completed verification and now requires an approval decision before execution can continue.",
      action_steps: [
        "Attach verified stock quantity.",
        "Attach recent demand evidence.",
        "Submit requested restock quantity.",
        "Route request to HQ for approval decision."
      ],
      responsible_party: "Branch Office",
      required_inputs: [
        "Verified stock quantity",
        "Recent demand evidence",
        "Requested restock quantity"
      ],
      expected_output: "HQ approval request for restock action.",
      dependencies: [
        "Completed branch verification",
        "HQ approval workflow"
      ],
      estimated_risk: "medium",
      impact_if_successful:
        "HQ can decide restock action using verified branch evidence.",
      confidence_score: 82
    },
    improvement_suggestions: [
      "Add a stock verification checklist before all restock approval requests."
    ]
  }
};

export const EXAMPLE_AI_FLOW = {
  requests: {
    input_understanding: EXAMPLE_INPUT_UNDERSTANDING_REQUEST,
    project_identification: EXAMPLE_PROJECT_IDENTIFICATION_REQUEST,
    phase_plan_generation: EXAMPLE_PHASE_PLAN_GENERATION_REQUEST,
    validation: EXAMPLE_VALIDATION_REQUEST,
    approval_recommendation: EXAMPLE_APPROVAL_RECOMMENDATION_REQUEST,
    outcome_review: EXAMPLE_OUTCOME_REVIEW_REQUEST
  },
  responses: {
    input_understanding: EXAMPLE_INPUT_UNDERSTANDING_RESPONSE,
    project_identification: EXAMPLE_PROJECT_IDENTIFICATION_RESPONSE,
    phase_plan_generation: EXAMPLE_PHASE_PLAN_GENERATION_RESPONSE,
    validation: EXAMPLE_VALIDATION_RESPONSE,
    approval_recommendation: EXAMPLE_APPROVAL_RECOMMENDATION_RESPONSE,
    outcome_review: EXAMPLE_OUTCOME_REVIEW_RESPONSE
  }
} as const;
